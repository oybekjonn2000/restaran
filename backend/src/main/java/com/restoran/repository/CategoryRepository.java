package com.restoran.repository;

import com.restoran.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);
    
    Optional<Category> findByRestaurantIdAndName(Long restaurantId, String name);
    
    List<Category> findByRestaurantId(Long restaurantId);
    
    boolean existsByRestaurantIdAndName(Long restaurantId, String name);
    
    boolean existsByRestaurantIdAndNameAndIdNot(Long restaurantId, String name, Long id);

    List<Category> findByRestaurantIsActiveTrue();

    @Query("SELECT c FROM Category c WHERE " +
           "(:restaurantId IS NULL OR c.restaurant.id = :restaurantId) AND " +
           "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Category> findAllPaginated(
        @Param("restaurantId") Long restaurantId,
        @Param("search") String search,
        Pageable pageable
    );
}
