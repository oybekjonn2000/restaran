package com.restoran.service;

import com.restoran.dto.request.FoodRequest;
import com.restoran.entity.Category;
import com.restoran.entity.Food;
import com.restoran.repository.CategoryRepository;
import com.restoran.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodRepository foodRepository;
    private final CategoryRepository categoryRepository;

    public List<Food> getAll() {
        return foodRepository.findAll();
    }

    public List<Food> getAvailable() {
        return foodRepository.findByAvailableTrue();
    }

    public List<Food> getByCategory(Long categoryId) {
        return foodRepository.findByAvailableTrueAndCategoryId(categoryId);
    }

    public Food getById(Long id) {
        return foodRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Taom topilmadi: " + id));
    }

    public List<Food> search(String query) {
        return foodRepository.findByNameContainingIgnoreCase(query);
    }

    public Food create(FoodRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new RuntimeException("Kategoriya topilmadi: " + request.getCategoryId()));

        Food food = Food.builder()
            .name(request.getName())
            .description(request.getDescription())
            .price(request.getPrice())
            .imageUrl(request.getImageUrl())
            .available(request.getAvailable() != null ? request.getAvailable() : true)
            .category(category)
            .build();

        return foodRepository.save(food);
    }

    public Food update(Long id, FoodRequest request) {
        Food food = getById(id);
        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new RuntimeException("Kategoriya topilmadi: " + request.getCategoryId()));

        food.setName(request.getName());
        food.setDescription(request.getDescription());
        food.setPrice(request.getPrice());
        food.setImageUrl(request.getImageUrl());
        food.setAvailable(request.getAvailable() != null ? request.getAvailable() : food.getAvailable());
        food.setCategory(category);

        return foodRepository.save(food);
    }

    public void delete(Long id) {
        foodRepository.deleteById(id);
    }

    public Food toggleAvailability(Long id) {
        Food food = getById(id);
        food.setAvailable(!food.getAvailable());
        return foodRepository.save(food);
    }
}
