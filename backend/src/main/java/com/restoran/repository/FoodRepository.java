package com.restoran.repository;

import com.restoran.entity.Food;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    List<Food> findByAvailableTrueAndRestaurantIsActiveTrue();
    List<Food> findByAvailableTrueAndCategoryIdAndRestaurantIsActiveTrue(Long categoryId);
    List<Food> findByNameContainingIgnoreCaseAndRestaurantIsActiveTrue(String name);

    @Query("SELECT f FROM Food f WHERE " +
           "(:restaurantId IS NULL OR f.restaurant.id = :restaurantId) AND " +
           "(:categoryId IS NULL OR f.category.id = :categoryId) AND " +
           "(:search IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(f.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Food> findAllPaginated(
        @Param("restaurantId") Long restaurantId,
        @Param("categoryId") Long categoryId,
        @Param("search") String search,
        Pageable pageable
    );
}
