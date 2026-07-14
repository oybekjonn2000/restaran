package com.restoran.service;

import com.restoran.entity.Category;
import com.restoran.entity.Restaurant;
import com.restoran.repository.CategoryRepository;
import com.restoran.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final RestaurantRepository restaurantRepository;

    public List<Category> getAll() {
        return categoryRepository.findByRestaurantIsActiveTrue();
    }

    public List<Category> getByRestaurantId(Long restaurantId) {
        Restaurant rest = restaurantRepository.findById(restaurantId).orElse(null);
        if (rest == null || !rest.isActive()) {
            return List.of();
        }
        return categoryRepository.findByRestaurantId(restaurantId);
    }

    public Page<Category> getPaginated(Long restaurantId, String search, Pageable pageable) {
        return categoryRepository.findAllPaginated(restaurantId, search, pageable);
    }

    public Category getById(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Kategoriya topilmadi: " + id));
        if (category.getRestaurant() != null && !category.getRestaurant().isActive()) {
            throw new RuntimeException("Kategoriya restorani faol emas!");
        }
        return category;
    }

    public Category create(String name, String imageUrl, Long restaurantId) {
        if (restaurantId == null) {
            throw new RuntimeException("Kategoriya yaratish uchun Restoran ko'rsatilishi shart!");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Kategoriya nomi kiritilishi shart!");
        }

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow(() -> new RuntimeException("Restoran topilmadi: " + restaurantId));

        if (categoryRepository.existsByRestaurantIdAndName(restaurantId, name.trim())) {
            throw new RuntimeException("Ushbu restoranda '" + name.trim() + "' nomli kategoriya allaqachon mavjud!");
        }

        Category category = Category.builder()
            .name(name.trim())
            .imageUrl(imageUrl)
            .restaurant(restaurant)
            .build();
        return categoryRepository.save(category);
    }

    public Category update(Long id, String name, String imageUrl, Long restaurantId) {
        Category category = getById(id);
        
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Kategoriya nomi kiritilishi shart!");
        }

        Long targetRestaurantId = restaurantId != null ? restaurantId : (category.getRestaurant() != null ? category.getRestaurant().getId() : null);
        if (targetRestaurantId == null) {
            throw new RuntimeException("Kategoriya Restoranga bog'lanmagan!");
        }

        if (categoryRepository.existsByRestaurantIdAndNameAndIdNot(targetRestaurantId, name.trim(), id)) {
            throw new RuntimeException("Ushbu restoranda '" + name.trim() + "' nomli kategoriya allaqachon mavjud!");
        }

        if (restaurantId != null && (category.getRestaurant() == null || !category.getRestaurant().getId().equals(restaurantId))) {
            Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restoran topilmadi: " + restaurantId));
            category.setRestaurant(restaurant);
        }

        category.setName(name.trim());
        category.setImageUrl(imageUrl);
        return categoryRepository.save(category);
    }

    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }
}
