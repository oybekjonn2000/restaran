package com.restoran.controller;

import com.restoran.entity.Food;
import com.restoran.entity.Restaurant;
import com.restoran.repository.FoodRepository;
import com.restoran.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantRepository restaurantRepository;
    private final FoodRepository foodRepository;

    @GetMapping
    public ResponseEntity<List<Restaurant>> getAllRestaurants() {
        return ResponseEntity.ok(restaurantRepository.findByIsActiveTrue());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(@PathVariable Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restoran topilmadi: " + id));
        if (!restaurant.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Restoran faol emas!");
        }
        return ResponseEntity.ok(restaurant);
    }

    @GetMapping("/{id}/foods")
    public ResponseEntity<List<Food>> getRestaurantFoods(
            @PathVariable Long id,
            @RequestParam(required = false) Long categoryId) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restoran topilmadi: " + id));
        if (!restaurant.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Restoran faol emas!");
        }
        if (categoryId != null) {
            return ResponseEntity.ok(foodRepository.findByRestaurantIdAndAvailableTrueAndCategoryId(id, categoryId));
        }
        return ResponseEntity.ok(foodRepository.findByRestaurantIdAndAvailableTrue(id));
    }
}
