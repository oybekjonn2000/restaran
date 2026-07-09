package com.restoran.controller;

import com.restoran.entity.Food;
import com.restoran.service.FoodService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/foods")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    @GetMapping
    public ResponseEntity<List<Food>> getAll() {
        return ResponseEntity.ok(foodService.getAvailable());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Food> getById(@PathVariable Long id) {
        return ResponseEntity.ok(foodService.getById(id));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Food>> getByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(foodService.getByCategory(categoryId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Food>> search(@RequestParam String q) {
        return ResponseEntity.ok(foodService.search(q));
    }
}
