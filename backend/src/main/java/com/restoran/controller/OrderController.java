package com.restoran.controller;

import com.restoran.dto.request.OrderRequest;
import com.restoran.dto.response.OrderRouteHistoryDto;
import com.restoran.entity.Order;
import com.restoran.security.UserDetailsImpl;
import com.restoran.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /** Mijoz — yangi buyurtma berish */
    @PostMapping
    public ResponseEntity<Order> createOrder(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(userDetails.getId(), request));
    }

    /** Mijoz — o'z buyurtmalarini ko'rish */
    @GetMapping("/my")
    public ResponseEntity<List<Order>> getMyOrders(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(orderService.getOrdersByUser(userDetails.getId()));
    }

    /** Bitta buyurtma ma'lumoti */
    @GetMapping("/{id}")
    public ResponseEntity<Order> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getAllOrders().stream()
            .filter(o -> o.getId().equals(id))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Buyurtma topilmadi: " + id)));
    }

    /** Statistika */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(orderService.getStats());
    }

    /** Smenada faol kuryer bormi? (mijoz savatida foydalaniladi) */
    @GetMapping("/courier-active")
    public ResponseEntity<Map<String, Boolean>> isCourierActive() {
        boolean active = orderService.isAnyCourierOnShift();
        return ResponseEntity.ok(Map.of("active", active));
    }

    /** Kuryer faol buyurtma davomida o'z GPS nuqtasini jo'natishi */
    @PostMapping("/{id}/gps-track")
    public ResponseEntity<Map<String, String>> recordGpsTrack(
            @PathVariable Long id,
            @RequestBody Map<String, Double> payload) {
        Double lat = payload.get("latitude");
        Double lng = payload.get("longitude");
        orderService.recordGpsTrackPoint(id, lat, lng);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    /** Admin & Manager — Buyurtma marshruti tarixini va statistikalarini olish */
    @GetMapping("/{id}/route-history")
    public ResponseEntity<OrderRouteHistoryDto> getRouteHistory(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderRouteHistory(id));
    }
}
