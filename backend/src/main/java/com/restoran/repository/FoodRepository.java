package com.restoran.repository;

import com.restoran.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {
    List<Food> findByCategoryId(Long categoryId);
    List<Food> findByAvailableTrue();
    List<Food> findByNameContainingIgnoreCase(String name);
    List<Food> findByAvailableTrueAndCategoryId(Long categoryId);
    
    List<Food> findByRestaurantId(Long restaurantId);
    List<Food> findByRestaurantIdAndCategoryId(Long restaurantId, Long categoryId);
    List<Food> findByRestaurantIdAndAvailableTrue(Long restaurantId);
    List<Food> findByRestaurantIdAndAvailableTrueAndCategoryId(Long restaurantId, Long categoryId);
}
