package com.restoran.controller;

import com.restoran.entity.Food;
import com.restoran.entity.Restaurant;
import com.restoran.repository.FoodRepository;
import com.restoran.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        return ResponseEntity.ok(restaurantRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(@PathVariable Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restoran topilmadi: " + id));
        return ResponseEntity.ok(restaurant);
    }

    @GetMapping("/{id}/foods")
    public ResponseEntity<List<Food>> getRestaurantFoods(
            @PathVariable Long id,
            @RequestParam(required = false) Long categoryId) {
        if (categoryId != null) {
            return ResponseEntity.ok(foodRepository.findByRestaurantIdAndAvailableTrueAndCategoryId(id, categoryId));
        }
        return ResponseEntity.ok(foodRepository.findByRestaurantIdAndAvailableTrue(id));
    }
}
