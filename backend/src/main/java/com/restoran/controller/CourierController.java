package com.restoran.controller;

import com.restoran.entity.Order;
import com.restoran.entity.OrderStatus;
import com.restoran.entity.Slot;
import com.restoran.security.UserDetailsImpl;
import com.restoran.service.OrderService;
import com.restoran.service.SlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/courier")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('COURIER')")
public class CourierController {

    private final OrderService orderService;
    private final SlotService slotService;

    /** READY holatidagi buyurtmalar — qabul qilish uchun */
    @GetMapping("/available")
    public ResponseEntity<List<Order>> getAvailableOrders() {
        return ResponseEntity.ok(orderService.getAvailableOrders());
    }

    /** Kuryer o'z aktiv buyurtmalarini ko'rish */
    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(orderService.getOrdersByCourier(userDetails.getId()));
    }

    /**
     * Queue logikasi bo'yicha faol buyurtmalar ma'lumoti.
     * visibleOrders: Ekranda ko'rinadigan buyurtmalar (max 2)
     *   - Bitta restorandan bo'lsa: ikkalasi ko'rinadi
     *   - Turli restorandan bo'lsa: faqat birinchisi, ikkinchisi navbatda
     * queuedOrders: Navbatdagi (yashirin) buyurtmalar
     * totalActive: Jami faol buyurtmalar soni
     */
    @GetMapping("/my-active-orders")
    public ResponseEntity<Map<String, Object>> getMyActiveOrders(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        List<OrderStatus> activeStatuses = List.of(
            OrderStatus.COURIER_ACCEPTED,
            OrderStatus.COURIER_AT_RESTAURANT,
            OrderStatus.DELIVERING,
            OrderStatus.COURIER_AT_CLIENT
        );

        List<Order> allOrders = orderService.getOrdersByCourier(userDetails.getId());

        // Faqat faol (tugalamagan) buyurtmalar, FIFO tartibida
        List<Order> activeOrders = allOrders.stream()
            .filter(o -> activeStatuses.contains(o.getStatus()))
            .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
            .toList();

        List<Order> visibleOrders = new ArrayList<>();
        List<Order> queuedOrders = new ArrayList<>();

        for (Order order : activeOrders) {
            if (visibleOrders.size() < 2) {
                if (visibleOrders.isEmpty()) {
                    visibleOrders.add(order);
                } else {
                    // Birinchi visible buyurtma bilan restoran tekshiruvi
                    Order first = visibleOrders.get(0);
                    Long firstRestId = first.getRestaurant() != null ? first.getRestaurant().getId() : null;
                    Long curRestId = order.getRestaurant() != null ? order.getRestaurant().getId() : null;
                    if (firstRestId != null && firstRestId.equals(curRestId)) {
                        // Bir xil restoran → ikkalasi ham visible
                        visibleOrders.add(order);
                    } else {
                        // Boshqa restoran → navbatga
                        queuedOrders.add(order);
                    }
                }
            } else {
                queuedOrders.add(order);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("visibleOrders", visibleOrders);
        result.put("queuedOrders", queuedOrders);
        result.put("totalActive", activeOrders.size());
        result.put("sameRestaurant", visibleOrders.size() == 2 &&
            visibleOrders.get(0).getRestaurant() != null &&
            visibleOrders.get(1).getRestaurant() != null &&
            visibleOrders.get(0).getRestaurant().getId().equals(visibleOrders.get(1).getRestaurant().getId()));

        return ResponseEntity.ok(result);
    }

    /**
     * Kuryer buyurtmani qabul qiladi → COURIER_ACCEPTED
     * MUHIM: Faqat aktiv smenasi bor kuryer qabul qila oladi
     */
    @PutMapping("/{orderId}/accept")
    public ResponseEntity<Order> acceptOrder(
            @PathVariable Long orderId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        if (!slotService.hasActiveSlot(userDetails.getId())) {
            throw new RuntimeException("Buyurtma qabul qilish uchun avval smenangizni boshlang!");
        }

        return ResponseEntity.ok(orderService.acceptOrder(orderId, userDetails.getId(), lat, lng));
    }

    /** Kuryer restoranga yetib keldi → COURIER_AT_RESTAURANT */
    @PutMapping("/{orderId}/arrive-restaurant")
    public ResponseEntity<Order> arriveRestaurant(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.updateStatus(orderId, OrderStatus.COURIER_AT_RESTAURANT));
    }

    /** Kuryer taomni oldi va yo'lga chiqdi → DELIVERING */
    @PutMapping("/{orderId}/pickup")
    public ResponseEntity<Order> pickupOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.updateStatus(orderId, OrderStatus.DELIVERING));
    }

    /** Kuryer mijoz manziliga yetib keldi → COURIER_AT_CLIENT */
    @PutMapping("/{orderId}/arrive-client")
    public ResponseEntity<Order> arriveClient(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.updateStatus(orderId, OrderStatus.COURIER_AT_CLIENT));
    }

    /** Kuryer buyurtmani topshirdi → DELIVERED */
    @PutMapping("/{orderId}/deliver")
    public ResponseEntity<Order> deliverOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.updateStatus(orderId, OrderStatus.DELIVERED));
    }

    // =================== SMENA ENDPOINTLARI ===================

    /** Kuryer uchun bugungi mavjud smenalar */
    @GetMapping("/slots/available")
    public ResponseEntity<List<Slot>> getAvailableSlots(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(slotService.getAvailableSlotsForCourier(userDetails.getId()));
    }

    /** Kuryer faol smenasini ko'rish */
    @GetMapping("/slots/active")
    public ResponseEntity<Map<String, Object>> getActiveSlot(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Optional<Slot> slot = slotService.getActiveSlotForCourier(userDetails.getId());
        if (slot.isPresent()) {
            return ResponseEntity.ok(Map.of("hasActiveSlot", true, "slot", slot.get()));
        }
        return ResponseEntity.ok(Map.of("hasActiveSlot", false));
    }

    /** Kuryer smenani boshlaydi */
    @PostMapping("/slots/{slotId}/start")
    public ResponseEntity<Slot> startSlot(
            @PathVariable Long slotId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(slotService.startSlot(slotId, userDetails.getId()));
    }

    /** Kuryer smenani tugatadi */
    @PostMapping("/slots/{slotId}/end")
    public ResponseEntity<Slot> endSlot(
            @PathVariable Long slotId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(slotService.endSlot(slotId, userDetails.getId()));
    }

    /** Kuryer smenani oldindan band qiladi */
    @PostMapping("/slots/{slotId}/book")
    public ResponseEntity<Slot> bookSlot(
            @PathVariable Long slotId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(slotService.bookSlot(slotId, userDetails.getId()));
    }

    /** Kuryer band qilgan smenasini bekor qiladi (jarima bilan) */
    @PostMapping("/slots/{slotId}/cancel")
    public ResponseEntity<SlotService.CancelResult> cancelSlot(
            @PathVariable Long slotId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(slotService.cancelSlot(slotId, userDetails.getId()));
    }

    /** Kuryer faqat o'zi band qilgan smenalar ro'yxatini oladi */
    @GetMapping("/slots/my-booked")
    public ResponseEntity<List<Slot>> getMyBookedSlots(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(slotService.getBookedSlotsForCourier(userDetails.getId()));
    }

    /** Kuryerga tegishli barcha smenalar (band qilingan + boshlangan + tugagan) */
    @GetMapping("/slots/all")
    public ResponseEntity<List<Slot>> getAllMySlots(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(slotService.getAllSlotsForCourier(userDetails.getId()));
    }

    /** Kuryer restoranga yetib bormay turib buyurtmani bekor qilishni so'raydi */
    @PostMapping("/{orderId}/request-cancel")
    public ResponseEntity<Order> requestCancel(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(orderService.requestCourierCancel(orderId, userDetails.getId()));
    }
}
