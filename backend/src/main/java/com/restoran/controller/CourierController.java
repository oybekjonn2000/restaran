package com.restoran.controller;

import com.restoran.entity.Order;
import com.restoran.entity.OrderStatus;
import com.restoran.security.UserDetailsImpl;
import com.restoran.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/courier")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('COURIER')")
public class CourierController {

    private final OrderService orderService;

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

    /** Kuryer buyurtmani qabul qiladi → COURIER_ACCEPTED */
    @PutMapping("/{orderId}/accept")
    public ResponseEntity<Order> acceptOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(orderService.acceptOrder(orderId, userDetails.getId()));
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
}
