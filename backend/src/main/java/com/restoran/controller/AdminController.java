package com.restoran.controller;

import com.restoran.dto.request.FoodRequest;
import com.restoran.dto.request.RegisterRequest;
import com.restoran.dto.response.MessageResponse;
import com.restoran.entity.*;
import com.restoran.repository.UserRepository;
import com.restoran.repository.RestaurantRepository;
import com.restoran.repository.OrderRepository;
import com.restoran.service.CategoryService;
import com.restoran.service.FoodService;
import com.restoran.service.OrderService;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminController {

    private final OrderService orderService;
    private final FoodService foodService;
    private final CategoryService categoryService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;

    // =================== BUYURTMALAR ===================

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }

    @PutMapping("/orders/{id}/assign")
    public ResponseEntity<Order> assignCourier(
            @PathVariable Long id,
            @RequestParam Long courierId) {
        return ResponseEntity.ok(orderService.assignCourier(id, courierId));
    }

    @GetMapping("/orders/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(orderService.getStats());
    }

    // =================== TAOMLAR ===================

    @GetMapping("/foods")
    public ResponseEntity<List<Food>> getAllFoods() {
        return ResponseEntity.ok(foodService.getAll());
    }

    @PostMapping("/foods")
    public ResponseEntity<Food> createFood(@RequestBody FoodRequest request) {
        return ResponseEntity.ok(foodService.create(request));
    }

    @PutMapping("/foods/{id}")
    public ResponseEntity<Food> updateFood(@PathVariable Long id, @RequestBody FoodRequest request) {
        return ResponseEntity.ok(foodService.update(id, request));
    }

    @DeleteMapping("/foods/{id}")
    public ResponseEntity<MessageResponse> deleteFood(@PathVariable Long id) {
        foodService.delete(id);
        return ResponseEntity.ok(MessageResponse.ok("Taom muvaffaqiyatli o'chirildi"));
    }

    @PutMapping("/foods/{id}/toggle")
    public ResponseEntity<Food> toggleFoodAvailability(@PathVariable Long id) {
        return ResponseEntity.ok(foodService.toggleAvailability(id));
    }

    // =================== KATEGORIYALAR ===================

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAll());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.create(request.getName(), request.getImageUrl()));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(
            @PathVariable Long id,
            @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.update(id, request.getName(), request.getImageUrl()));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<MessageResponse> deleteCategory(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(MessageResponse.ok("Kategoriya o'chirildi"));
    }

    // =================== FOYDALANUVCHILAR ===================

    @GetMapping("/couriers")
    public ResponseEntity<List<User>> getCouriers() {
        return ResponseEntity.ok(userRepository.findByRole(Role.COURIER));
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Bu email allaqachon ro'yxatdan o'tgan!");
        }

        Role role = Role.CLIENT;
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                role = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword() != null ? request.getPassword() : "123456"))
            .phone(request.getPhone())
            .address(request.getAddress())
            .role(role)
            .build();

        return ResponseEntity.ok(userRepository.save(user));
    }

    @GetMapping("/couriers/stats")
    public ResponseEntity<List<CourierStatsResponse>> getCourierStats() {
        List<User> couriers = userRepository.findByRole(Role.COURIER);
        List<CourierStatsResponse> response = couriers.stream().map(c -> {
            List<Order> courierOrders = orderService.getOrdersByCourier(c.getId());
            
            double totalEarnings = courierOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .mapToDouble(o -> o.getDeliveryFee() != null ? o.getDeliveryFee() : 0.0)
                .sum();

            long completedCount = courierOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .count();

            boolean isBusy = courierOrders.stream()
                .anyMatch(o -> o.getStatus() != OrderStatus.DELIVERED 
                            && o.getStatus() != OrderStatus.CANCELED 
                            && o.getStatus() != OrderStatus.PENDING);

            return CourierStatsResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .isBusy(isBusy)
                .completedOrdersCount(completedCount)
                .totalEarnings(totalEarnings)
                .build();
        }).toList();
        
        return ResponseEntity.ok(response);
    }

    // =================== RESTORANLAR (ADMIN EN KATTA BOSS) ===================

    @GetMapping("/restaurants")
    public ResponseEntity<List<Restaurant>> getRestaurants() {
        return ResponseEntity.ok(restaurantRepository.findAll());
    }

    @PostMapping("/restaurants")
    public ResponseEntity<Restaurant> createRestaurant(@RequestBody RestaurantAdminRequest request) {
        User owner = null;
        if (request.getOwnerId() != null) {
            owner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Menejer topilmadi: " + request.getOwnerId()));
            if (owner.getRole() != Role.MANAGER) {
                throw new RuntimeException("Foydalanuvchi menejer emas!");
            }
        }

        Restaurant restaurant = Restaurant.builder()
            .name(request.getName())
            .imageUrl(request.getImageUrl())
            .address(request.getAddress())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .owner(owner)
            .build();

        return ResponseEntity.ok(restaurantRepository.save(restaurant));
    }

    @PutMapping("/restaurants/{id}")
    public ResponseEntity<Restaurant> updateRestaurant(@PathVariable Long id, @RequestBody RestaurantAdminRequest request) {
        Restaurant restaurant = restaurantRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Restoran topilmadi: " + id));

        User owner = null;
        if (request.getOwnerId() != null) {
            owner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Menejer topilmadi: " + request.getOwnerId()));
            if (owner.getRole() != Role.MANAGER) {
                throw new RuntimeException("Foydalanuvchi menejer emas!");
            }
        }

        restaurant.setName(request.getName());
        restaurant.setImageUrl(request.getImageUrl());
        restaurant.setAddress(request.getAddress());
        restaurant.setLatitude(request.getLatitude());
        restaurant.setLongitude(request.getLongitude());
        restaurant.setOwner(owner);

        return ResponseEntity.ok(restaurantRepository.save(restaurant));
    }

    @DeleteMapping("/restaurants/{id}")
    public ResponseEntity<MessageResponse> deleteRestaurant(@PathVariable Long id) {
        restaurantRepository.deleteById(id);
        return ResponseEntity.ok(MessageResponse.ok("Restoran muvaffaqiyatli o'chirildi"));
    }

    @GetMapping("/managers")
    public ResponseEntity<List<User>> getManagers() {
        return ResponseEntity.ok(userRepository.findByRole(Role.MANAGER));
    }

    // =================== MIJOZLAR (CLIENTS MANAGEMENT) ===================

    @GetMapping("/clients")
    public ResponseEntity<List<ClientStatsResponse>> getClients() {
        List<User> clients = userRepository.findByRole(Role.CLIENT);
        List<ClientStatsResponse> response = clients.stream().map(c -> {
            List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(c);
            long ordersCount = orders.size();
            double totalSpent = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .mapToDouble(o -> o.getTotalPrice() + (o.getDeliveryFee() != null ? o.getDeliveryFee() : 0))
                .sum();

            return ClientStatsResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .address(c.getAddress())
                .totalOrdersCount(ordersCount)
                .totalSpent(totalSpent)
                .build();
        }).toList();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/clients/{id}")
    public ResponseEntity<User> updateClient(@PathVariable Long id, @RequestBody ClientUpdateRequest request) {
        User client = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Mijoz topilmadi: " + id));
        if (client.getRole() != Role.CLIENT) {
            throw new RuntimeException("Foydalanuvchi mijoz emas!");
        }

        client.setName(request.getName());
        client.setPhone(request.getPhone());
        client.setAddress(request.getAddress());
        
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() && !request.getEmail().equalsIgnoreCase(client.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email allaqachon band: " + request.getEmail());
            }
            client.setEmail(request.getEmail());
        }

        return ResponseEntity.ok(userRepository.save(client));
    }

    @DeleteMapping("/clients/{id}")
    public ResponseEntity<MessageResponse> deleteClient(@PathVariable Long id) {
        User client = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Mijoz topilmadi: " + id));
        if (client.getRole() != Role.CLIENT) {
            throw new RuntimeException("Foydalanuvchi mijoz emas!");
        }

        List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(client);
        orderRepository.deleteAll(orders);

        userRepository.delete(client);
        return ResponseEntity.ok(MessageResponse.ok("Mijoz muvaffaqiyatli o'chirildi"));
    }

    // Inner DTOs
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ClientUpdateRequest {
        private String name;
        private String email;
        private String phone;
        private String address;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ClientStatsResponse {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String address;
        private long totalOrdersCount;
        private double totalSpent;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RestaurantAdminRequest {
        private String name;
        private String imageUrl;
        private String address;
        private Double latitude;
        private Double longitude;
        private Long ownerId;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CourierStatsResponse {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private boolean isBusy;
        private long completedOrdersCount;
        private double totalEarnings;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    static class CategoryRequest {
        private String name;
        private String imageUrl;
    }
}
