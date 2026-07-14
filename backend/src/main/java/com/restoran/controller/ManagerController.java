package com.restoran.controller;

import com.restoran.dto.request.FoodRequest;
import com.restoran.dto.response.MessageResponse;
import com.restoran.entity.*;
import com.restoran.repository.RestaurantRepository;
import com.restoran.repository.UserRepository;
import com.restoran.repository.OrderRepository;
import com.restoran.repository.SlotRepository;
import com.restoran.service.FoodService;
import com.restoran.service.OrderService;
import com.restoran.security.UserDetailsImpl;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.restoran.service.CategoryService;

@RestController
@RequestMapping("/api/manager")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerController {

    private final RestaurantRepository restaurantRepository;
    private final FoodService foodService;
    private final CategoryService categoryService;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final UserRepository userRepository;
    private final SlotRepository slotRepository;

    @GetMapping("/my-restaurant")
    public ResponseEntity<Restaurant> getMyRestaurant(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));
        return ResponseEntity.ok(restaurant);
    }

    @PutMapping("/my-restaurant")
    public ResponseEntity<Restaurant> updateMyRestaurant(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody RestaurantUpdateRequest request) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));

        restaurant.setName(request.getName());
        restaurant.setImageUrl(request.getImageUrl());
        restaurant.setAddress(request.getAddress());
        restaurant.setLatitude(request.getLatitude());
        restaurant.setLongitude(request.getLongitude());

        return ResponseEntity.ok(restaurantRepository.save(restaurant));
    }

    @GetMapping("/foods")
    public ResponseEntity<Page<Food>> getMyFoods(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));
        
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(foodService.getPaginated(restaurant.getId(), categoryId, search, pageable));
    }

    @PostMapping("/foods")
    public ResponseEntity<Food> createMyFood(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody FoodRequest request) {
        // Restaurant managerId orqali avtomatik aniqlanadi
        // Frontend restaurantId yubormasin
        Food food = foodService.createForManager(request, userDetails.getId());
        return ResponseEntity.ok(food);
    }

    @PutMapping("/foods/{id}")
    public ResponseEntity<Food> updateMyFood(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id,
            @RequestBody FoodRequest request) {
        // Ownership tekshiruvi va yangilash service ichida bajariladi
        return ResponseEntity.ok(foodService.updateForManager(id, request, userDetails.getId()));
    }

    @DeleteMapping("/foods/{id}")
    public ResponseEntity<MessageResponse> deleteMyFood(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        foodService.deleteForManager(id, userDetails.getId());
        return ResponseEntity.ok(MessageResponse.ok("Taom o'chirildi"));
    }

    @PutMapping("/foods/{id}/toggle")
    public ResponseEntity<Food> toggleMyFood(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(foodService.toggleAvailabilityForManager(id, userDetails.getId()));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getMyOrders(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));
        List<Order> orders = orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurant.getId());
        for (Order order : orders) {
            if (order.getCourier() != null) {
                order.setCourierActiveOnShift(slotRepository.findActiveSlotForCourier(order.getCourier().getId()).isPresent());
            } else {
                order.setCourierActiveOnShift(false);
            }
        }
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateMyOrderStatus(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Buyurtma topilmadi"));
        if (!order.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Ruxsat berilmagan!");
        }

        Order updated = orderService.updateStatus(id, status);
        if (updated.getCourier() != null) {
            updated.setCourierActiveOnShift(slotRepository.findActiveSlotForCourier(updated.getCourier().getId()).isPresent());
        }
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/orders/{id}/ready")
    public ResponseEntity<Order> markMyOrderAsReady(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Buyurtma topilmadi"));
        if (!order.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Ruxsat berilmagan!");
        }

        Order updated = orderService.markOrderAsReady(id);
        if (updated.getCourier() != null) {
            updated.setCourierActiveOnShift(slotRepository.findActiveSlotForCourier(updated.getCourier().getId()).isPresent());
        }
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/orders/{id}/cancel")
    public ResponseEntity<Order> cancelMyOrder(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id,
            @RequestParam String reason) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Buyurtma topilmadi"));
        if (!order.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Ruxsat berilmagan!");
        }

        return ResponseEntity.ok(orderService.cancelOrderWithReason(id, reason));
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RestaurantUpdateRequest {
        private String name;
        private String imageUrl;
        private String address;
        private Double latitude;
        private Double longitude;
    }

    // =================== KATEGORIYALAR (MANAGER) ===================

    @GetMapping("/categories")
    public ResponseEntity<Page<Category>> getMyCategories(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(categoryService.getPaginated(restaurant.getId(), search, pageable));
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createMyCategory(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody CategoryRequest request) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));
        
        return ResponseEntity.ok(categoryService.create(request.getName(), request.getImageUrl(), restaurant.getId()));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateMyCategory(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id,
            @RequestBody CategoryRequest request) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));
        
        Category category = categoryService.getById(id);
        if (category.getRestaurant() == null || !category.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Siz faqat o'z restoraningiz kategoriyalarini tahrirlashingiz mumkin!");
        }

        return ResponseEntity.ok(categoryService.update(id, request.getName(), request.getImageUrl(), restaurant.getId()));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<MessageResponse> deleteMyCategory(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));
        
        Category category = categoryService.getById(id);
        if (category.getRestaurant() == null || !category.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Siz faqat o'z restoraningiz kategoriyalarini o'chirishingiz mumkin!");
        }

        categoryService.delete(id);
        return ResponseEntity.ok(MessageResponse.ok("Kategoriya o'chirildi"));
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CategoryRequest {
        private String name;
        private String imageUrl;
    }
}
