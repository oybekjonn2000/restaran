package com.restoran.controller;

import com.restoran.entity.CartItem;
import com.restoran.security.UserDetailsImpl;
import com.restoran.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<List<CartItem>> getCart(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(cartService.getCart(userDetails.getId()));
    }

    @PostMapping("/sync")
    public ResponseEntity<List<CartItem>> syncCart(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody List<CartService.CartItemDto> items) {
        if (userDetails == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(cartService.syncCart(userDetails.getId(), items));
    }
}
