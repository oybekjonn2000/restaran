package com.restoran.service;

import com.restoran.dto.request.OrderRequest;
import com.restoran.entity.*;
import com.restoran.repository.FoodRepository;
import com.restoran.repository.OrderRepository;
import com.restoran.repository.UserRepository;
import com.restoran.repository.RestaurantRepository;
import com.restoran.repository.SlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final SlotRepository slotRepository;
    private final FoodRepository foodRepository;
    private final RestaurantRepository restaurantRepository;
    private final TelegramBotService telegramBotService;

    private static final double REST_LAT = 38.866127;
    private static final double REST_LNG = 65.816309;
    private static final double BASE_FEE = 10000.0;
    private static final double PER_KM_FEE = 1800.0;

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public Order createOrder(Long userId, OrderRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi: " + userId));

        Long restId = request.getRestaurantId();
        if (restId == null && request.getItems() != null && !request.getItems().isEmpty()) {
            Food firstFood = foodRepository.findById(request.getItems().get(0).getFoodId())
                .orElseThrow(() -> new RuntimeException("Taom topilmadi"));
            if (firstFood.getRestaurant() != null) {
                restId = firstFood.getRestaurant().getId();
            }
        }

        Restaurant restaurant = null;
        double restLat = REST_LAT;
        double restLng = REST_LNG;

        final Long finalRestId = restId;
        if (finalRestId != null) {
            restaurant = restaurantRepository.findById(finalRestId)
                .orElseThrow(() -> new RuntimeException("Restoran topilmadi: " + finalRestId));
            if (restaurant.getLatitude() != null && restaurant.getLongitude() != null) {
                restLat = restaurant.getLatitude();
                restLng = restaurant.getLongitude();
            }
        }

        double distance = request.getDistance() != null ? request.getDistance() : 0.0;
        double deliveryFee = request.getDeliveryFee() != null ? request.getDeliveryFee() : BASE_FEE;

        if (distance == 0.0 && request.getLatitude() != null && request.getLongitude() != null && request.getLatitude() != 0 && request.getLongitude() != 0) {
            distance = calculateDistance(restLat, restLng, request.getLatitude(), request.getLongitude());
            distance = Math.round(distance * 10.0) / 10.0; // Round to 1 decimal place
            deliveryFee = BASE_FEE + (distance * PER_KM_FEE);
            deliveryFee = Math.round(deliveryFee / 100.0) * 100.0; // Round to nearest 100 so'm
        }

        boolean anyCourierOnShift = isAnyCourierOnShift();
        Order order = Order.builder()
            .user(user)
            .restaurant(restaurant)
            .status(OrderStatus.PENDING)
            .deliveryAddress(request.getDeliveryAddress())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .distance(distance)
            .deliveryFee(anyCourierOnShift ? deliveryFee : 0.0)
            .yandexDelivery(!anyCourierOnShift)
            .note(request.getNote())
            .build();

        double total = 0;
        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Food food = foodRepository.findById(itemReq.getFoodId())
                .orElseThrow(() -> new RuntimeException("Taom topilmadi: " + itemReq.getFoodId()));

            OrderItem item = OrderItem.builder()
                .order(order)
                .food(food)
                .quantity(itemReq.getQuantity())
                .price(food.getPrice())
                .build();

            order.getItems().add(item);
            total += food.getPrice() * itemReq.getQuantity();
        }

        order.setTotalPrice(total);
        return orderRepository.save(order);
    }

    public Order updateStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Buyurtma topilmadi: " + orderId));

        if (status == OrderStatus.DELIVERING) {
            if (order.getCourier() != null && (order.getIsReady() == null || !order.getIsReady())) {
                throw new RuntimeException("Buyurtma hali tayyor emas! Restoran xodimi tayyor deb tasdiqlashini kuting.");
            }
        }

        order.setStatus(status);

        if (status == OrderStatus.PREPARING) {
            // Auto-assign courier when restaurant accepts
            if (order.getCourier() == null) {
                autoAssignCourier(order);
            }
        } else if (status == OrderStatus.DELIVERED) {
            // Balansni oshirish — faqat kuryer smenada faol bo'lsa yetkazish summasi balansga qo'shiladi!
            if (order.getCourier() != null) {
                User courier = order.getCourier();
                boolean isActive = slotRepository.findActiveSlotForCourier(courier.getId()).isPresent();
                order.setCourierActiveOnShift(isActive);
                if (isActive) {
                    long currentBalance = courier.getBalance() != null ? courier.getBalance() : 0L;
                    double fee = order.getDeliveryFee() != null ? order.getDeliveryFee() : 0.0;
                    courier.setBalance(currentBalance + (long) fee);
                    userRepository.save(courier);
                }
            }

            // Free courier to take other orders
            if (order.getCourier() != null) {
                backfillCourier(order.getCourier());
            }
        } else if (status == OrderStatus.CANCELED) {
            if (order.getCourier() != null) {
                backfillCourier(order.getCourier());
            }
        }

        if (order.getCourier() != null) {
            order.setCourierActiveOnShift(slotRepository.findActiveSlotForCourier(order.getCourier().getId()).isPresent());
        }
        return orderRepository.save(order);
    }

    public Order cancelOrderWithReason(Long orderId, String reason) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Buyurtma topilmadi: " + orderId));
        order.setStatus(OrderStatus.CANCELED);
        order.setCancelReason(reason);

        if (order.getCourier() != null) {
            backfillCourier(order.getCourier());
        }

        if (order.getCourier() != null) {
            order.setCourierActiveOnShift(slotRepository.findActiveSlotForCourier(order.getCourier().getId()).isPresent());
        }
        return orderRepository.save(order);
    }

    private void autoAssignCourier(Order order) {
        // Smenada faol kuryer bormi?
        boolean anyCourierOnShift = slotRepository.findByStartedTrueAndFinishedFalse().stream()
            .anyMatch(s -> s.getCourier() != null);

        if (!anyCourierOnShift) {
            order.setYandexDelivery(true);
            return; // Smenada kuryer yo'qligi uchun Yandex yetkazib beradi
        }
        order.setYandexDelivery(false);

        List<User> couriers = userRepository.findByRole(Role.COURIER);
        List<OrderStatus> activeStatuses = List.of(
            OrderStatus.PREPARING,
            OrderStatus.COURIER_ACCEPTED,
            OrderStatus.COURIER_AT_RESTAURANT,
            OrderStatus.DELIVERING,
            OrderStatus.COURIER_AT_CLIENT
        );

        String attempted = order.getAttemptedCourierIds() != null ? order.getAttemptedCourierIds() : "";
        boolean assigned = false;

        for (User courier : couriers) {
            String idStr = "[" + courier.getId() + "]";
            if (attempted.contains(idStr)) {
                continue;
            }

            // Kuryer faol smenada (started=true, finished=false) ekanligini tekshiramiz
            if (slotRepository.findActiveSlotForCourier(courier.getId()).isEmpty()) {
                continue;
            }

            if (!orderRepository.existsByCourierAndStatusIn(courier, activeStatuses)) {
                setCourierOnOrder(order, courier);
                order.setAssignedAt(java.time.LocalDateTime.now());
                order.setAttemptedCourierIds(attempted + idStr + ",");
                assigned = true;
                break;
            }
        }

        // Agar hamma kuryerlar urinib ko'rilgan bo'lsa va topshirilmagan bo'lsa, ro'yxatni tozalab qaytadan urinamiz
        if (!assigned && !couriers.isEmpty() && attempted.length() > 0) {
            order.setAttemptedCourierIds("");
            for (User courier : couriers) {
                // Kuryer faol smenada ekanligini tekshiramiz
                if (slotRepository.findActiveSlotForCourier(courier.getId()).isEmpty()) {
                    continue;
                }

                if (!orderRepository.existsByCourierAndStatusIn(courier, activeStatuses)) {
                    setCourierOnOrder(order, courier);
                    order.setAssignedAt(java.time.LocalDateTime.now());
                    order.setAttemptedCourierIds("[" + courier.getId() + "],");
                    break;
                }
            }
        }
    }

    private void backfillCourier(User courier) {
        // Faol smenada bo'lmasa, buyurtma biriktirmaymiz
        if (slotRepository.findActiveSlotForCourier(courier.getId()).isEmpty()) {
            return;
        }

        List<Order> unassignedOrders = orderRepository.findByStatusOrderByCreatedAtAsc(OrderStatus.PREPARING);
        for (Order o : unassignedOrders) {
            if (o.getCourier() == null) {
                String attempted = o.getAttemptedCourierIds() != null ? o.getAttemptedCourierIds() : "";
                if (!attempted.contains("[" + courier.getId() + "]")) {
                    setCourierOnOrder(o, courier);
                    o.setAssignedAt(java.time.LocalDateTime.now());
                    o.setAttemptedCourierIds(attempted + "[" + courier.getId() + "],");
                    orderRepository.save(o);
                    break;
                }
            }
        }
    }

    public Order acceptOrder(Long orderId, Long courierId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Buyurtma topilmadi: " + orderId));
        User courier = userRepository.findById(courierId)
            .orElseThrow(() -> new RuntimeException("Kuryer topilmadi: " + courierId));

        // Kuryer faol smenada ekanligini tekshiramiz
        if (slotRepository.findActiveSlotForCourier(courierId).isEmpty()) {
            throw new RuntimeException("Siz faol smenada emassiz! Buyurtmalarni qabul qilish uchun smenangizni boshlang.");
        }

        if (order.getCourier() != null && !order.getCourier().getId().equals(courierId)) {
            throw new RuntimeException("Bu buyurtmani boshqa kuryer allaqachon qabul qilgan!");
        }

        setCourierOnOrder(order, courier);
        order.setStatus(OrderStatus.COURIER_ACCEPTED);
        order.setAssignedAt(null); // Qabul qilingach sanoq to'xtaydi
        return orderRepository.save(order);
    }

    public Order assignCourier(Long orderId, Long courierId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Buyurtma topilmadi: " + orderId));
        User courier = userRepository.findById(courierId)
            .orElseThrow(() -> new RuntimeException("Kuryer topilmadi: " + courierId));
        setCourierOnOrder(order, courier);
        order.setAssignedAt(java.time.LocalDateTime.now());
        String attempted = order.getAttemptedCourierIds() != null ? order.getAttemptedCourierIds() : "";
        order.setAttemptedCourierIds(attempted + "[" + courierId + "],");
        return orderRepository.save(order);
    }

    /** 
     * Har 5 soniyada qabul qilinmagan buyurtmalarni tekshiradi.
     * Agar 2 daqiqa o'tgan bo'lsa, kuryerdan qaytarib olib boshqasiga auto-assign qiladi.
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 5000)
    public void checkOrderAcceptTimeouts() {
        List<Order> activeOrders = orderRepository.findByStatusOrderByCreatedAtAsc(OrderStatus.PREPARING);
        for (Order order : activeOrders) {
            if (order.getCourier() != null && order.getAssignedAt() != null) {
                if (order.getAssignedAt().plusMinutes(2).isBefore(java.time.LocalDateTime.now())) {
                    System.out.println(">>> Timeout: #" + order.getId() + " buyurtma kuryer tomonidan 2 daqiqa ichida qabul qilinmadi. Qayta taqsimlanmoqda...");
                    setCourierOnOrder(order, null);
                    order.setAssignedAt(null);
                    autoAssignCourier(order);
                    orderRepository.save(order);
                } else {
                    // Send repeated Telegram notification if courier is configured and not accepted yet
                    User courier = order.getCourier();
                    if (courier != null && courier.getTelegramId() != null) {
                        String msg = "🔔 *YANGI BUYURTMA! (Qabul qilishingiz kutilmoqda)*\n\n" +
                                     "📦 *Buyurtma:* #" + order.getId() + "\n" +
                                     "🏪 *Restoran:* " + (order.getRestaurant() != null ? order.getRestaurant().getName() : "Restoran") + "\n" +
                                     "📍 *Manzil:* " + order.getDeliveryAddress() + "\n" +
                                     "💰 *Taomlar summasi:* " + String.format("%,.0f", order.getTotalPrice()) + " so'm\n\n" +
                                     "⚡ *Iltimos, faol smenadagi kuryer sifatida ilovaga kirib buyurtmani qabul qiling!*";
                        telegramBotService.sendMessage(courier.getTelegramId(), msg);
                    }
                }
            }
        }
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Order> getOrdersByUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi: " + userId));
        return orderRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Order> getOrdersByCourier(Long courierId) {
        User courier = userRepository.findById(courierId)
            .orElseThrow(() -> new RuntimeException("Kuryer topilmadi: " + courierId));
        return orderRepository.findByCourierOrderByCreatedAtDesc(courier);
    }

    public List<Order> getAvailableOrders() {
        return orderRepository.findByStatusOrderByCreatedAtAsc(OrderStatus.PREPARING).stream()
            .filter(o -> o.getCourier() == null)
            .toList();
    }

    public Map<String, Long> getStats() {
        return Map.of(
            "total", orderRepository.count(),
            "pending", orderRepository.countByStatus(OrderStatus.PENDING),
            "preparing", orderRepository.countByStatus(OrderStatus.PREPARING) 
                         + orderRepository.countByStatus(OrderStatus.COURIER_ACCEPTED)
                         + orderRepository.countByStatus(OrderStatus.COURIER_AT_RESTAURANT),
            "delivering", orderRepository.countByStatus(OrderStatus.DELIVERING)
                          + orderRepository.countByStatus(OrderStatus.COURIER_AT_CLIENT),
            "delivered", orderRepository.countByStatus(OrderStatus.DELIVERED)
        );
    }

    /** Hozir smenada faol kuryer bor-yo'qligini tekshiradi */
    public boolean isAnyCourierOnShift() {
        return slotRepository.findByStartedTrueAndFinishedFalse().stream()
            .anyMatch(s -> s.getCourier() != null);
    }

    private void calculateAndSetDeliveryFee(Order order) {
        double dist = order.getDistance() != null ? order.getDistance() : 0.0;
        if (dist == 0.0 && order.getLatitude() != null && order.getLongitude() != null && order.getLatitude() != 0 && order.getLongitude() != 0) {
            double rLat = REST_LAT;
            double rLng = REST_LNG;
            if (order.getRestaurant() != null && order.getRestaurant().getLatitude() != null && order.getRestaurant().getLongitude() != null) {
                rLat = order.getRestaurant().getLatitude();
                rLng = order.getRestaurant().getLongitude();
            }
            dist = calculateDistance(rLat, rLng, order.getLatitude(), order.getLongitude());
            dist = Math.round(dist * 10.0) / 10.0;
            order.setDistance(dist);
        }
        double deliveryFee = BASE_FEE + (dist * PER_KM_FEE);
        deliveryFee = Math.round(deliveryFee / 100.0) * 100.0;
        order.setDeliveryFee(deliveryFee);
    }

    private void setCourierOnOrder(Order order, User courier) {
        order.setCourier(courier);
        if (courier != null) {
            calculateAndSetDeliveryFee(order);
        } else {
            order.setDeliveryFee(0.0);
        }
    }

    public Order markOrderAsReady(Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Buyurtma topilmadi: " + orderId));
        order.setIsReady(true);

        boolean hasActiveCourier = false;
        if (order.getCourier() != null) {
            hasActiveCourier = slotRepository.findActiveSlotForCourier(order.getCourier().getId()).isPresent();
        }

        if (!hasActiveCourier) {
            order.setYandexDelivery(true);
            order.setStatus(OrderStatus.DELIVERING);
            if (order.getCourier() != null) {
                backfillCourier(order.getCourier());
                order.setCourier(null);
            }
        }

        return orderRepository.save(order);
    }
}
