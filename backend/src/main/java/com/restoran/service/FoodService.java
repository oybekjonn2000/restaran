package com.restoran.service;

import com.restoran.dto.request.FoodRequest;
import com.restoran.entity.Category;
import com.restoran.entity.Food;
import com.restoran.entity.Restaurant;
import com.restoran.repository.CategoryRepository;
import com.restoran.repository.FoodRepository;
import com.restoran.repository.RestaurantRepository;
import com.restoran.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodRepository foodRepository;
    private final CategoryRepository categoryRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    // =================== PUBLIC READ ===================

    public List<Food> getAll() {
        return foodRepository.findAll();
    }

    public Page<Food> getPaginated(Long restaurantId, Long categoryId, String search, Pageable pageable) {
        return foodRepository.findAllPaginated(restaurantId, categoryId, search, pageable);
    }

    public List<Food> getAvailable() {
        return foodRepository.findByAvailableTrueAndRestaurantIsActiveTrue();
    }

    public List<Food> getByCategory(Long categoryId) {
        return foodRepository.findByAvailableTrueAndCategoryIdAndRestaurantIsActiveTrue(categoryId);
    }

    public List<Food> getByRestaurantId(Long restaurantId) {
        Restaurant rest = restaurantRepository.findById(restaurantId).orElse(null);
        if (rest == null || !rest.isActive()) {
            return List.of();
        }
        return foodRepository.findByRestaurantId(restaurantId);
    }

    public Food getById(Long id) {
        Food food = foodRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Taom topilmadi: " + id));
        if (food.getRestaurant() != null && !food.getRestaurant().isActive()) {
            throw new RuntimeException("Taom restorani faol emas!");
        }
        return food;
    }

    public List<Food> search(String query) {
        return foodRepository.findByNameContainingIgnoreCaseAndRestaurantIsActiveTrue(query);
    }

    // =================== ADMIN: CREATE ===================

    /**
     * Admin yangi taom qo'shadi.
     * restaurantId requestda majburiy — validatsiya AdminController'da.
     */
    public Food createForAdmin(FoodRequest request) {
        if (request.getRestaurantId() == null) {
            throw new RuntimeException("Admin uchun restaurantId majburiy!");
        }
        Category category = findCategory(request.getCategoryId());
        Restaurant restaurant = findRestaurant(request.getRestaurantId());

        // Validate Category matches Restaurant
        if (category.getRestaurant() == null || !category.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Tanlangan kategoriya ushbu restoranga tegishli emas!");
        }

        Food food = Food.builder()
            .name(request.getName())
            .description(request.getDescription())
            .price(request.getPrice())
            .imageUrl(request.getImageUrl())
            .available(request.getAvailable() != null ? request.getAvailable() : true)
            .category(category)
            .restaurant(restaurant)
            .build();

        return foodRepository.save(food);
    }

    // =================== ADMIN: UPDATE ===================

    /**
     * Admin taomni yangilaydi.
     * restaurantId berilsa yangilaydi, null bo'lsa mavjud qoladi.
     */
    public Food updateForAdmin(Long id, FoodRequest request) {
        Food food = getById(id);
        Category category = findCategory(request.getCategoryId());
        
        Long targetRestaurantId = request.getRestaurantId() != null 
            ? request.getRestaurantId() 
            : (food.getRestaurant() != null ? food.getRestaurant().getId() : null);

        if (targetRestaurantId == null) {
            throw new RuntimeException("Taom restoranga bog'lanmagan!");
        }

        Restaurant restaurant = findRestaurant(targetRestaurantId);

        // Validate Category matches Restaurant
        if (category.getRestaurant() == null || !category.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Tanlangan kategoriya ushbu restoranga tegishli emas!");
        }

        food.setName(request.getName());
        food.setDescription(request.getDescription());
        food.setPrice(request.getPrice());
        food.setImageUrl(request.getImageUrl());
        food.setAvailable(request.getAvailable() != null ? request.getAvailable() : food.getAvailable());
        food.setCategory(category);
        food.setRestaurant(restaurant);

        return foodRepository.save(food);
    }

    // =================== MANAGER: CREATE ===================

    /**
     * Manager yangi taom qo'shadi.
     * Restaurant managerId orqali avtomatik aniqlanadi.
     * Frontend restaurantId yubormasin — backend o'zi qo'yadi.
     */
    public Food createForManager(FoodRequest request, Long managerId) {
        Category category = findCategory(request.getCategoryId());
        Restaurant restaurant = restaurantRepository.findByOwnerId(managerId)
            .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));

        // Validate Category matches Restaurant (Manager cannot post category of another restaurant)
        if (category.getRestaurant() == null || !category.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Tanlangan kategoriya sizning restoraningizga tegishli emas!");
        }

        Food food = Food.builder()
            .name(request.getName())
            .description(request.getDescription())
            .price(request.getPrice())
            .imageUrl(request.getImageUrl())
            .available(request.getAvailable() != null ? request.getAvailable() : true)
            .category(category)
            .restaurant(restaurant)
            .build();

        return foodRepository.save(food);
    }

    // =================== MANAGER: UPDATE ===================

    /**
     * Manager o'z restoraniga tegishli taomni yangilaydi.
     * Ownership tekshiriladi — boshqa restoran taomini o'zgartira olmaydi.
     */
    public Food updateForManager(Long id, FoodRequest request, Long managerId) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(managerId)
            .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));

        Food food = getById(id);

        // Ownership check
        if (food.getRestaurant() == null || !food.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Siz faqat o'z restoraningiz taomlarini tahrirlashingiz mumkin!");
        }

        Category category = findCategory(request.getCategoryId());

        // Validate Category matches Restaurant
        if (category.getRestaurant() == null || !category.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Tanlangan kategoriya sizning restoraningizga tegishli emas!");
        }

        food.setName(request.getName());
        food.setDescription(request.getDescription());
        food.setPrice(request.getPrice());
        food.setImageUrl(request.getImageUrl());
        food.setAvailable(request.getAvailable() != null ? request.getAvailable() : food.getAvailable());
        food.setCategory(category);
        // Restaurant remains unchanged

        return foodRepository.save(food);
    }

    // =================== DELETE / TOGGLE ===================

    public void delete(Long id) {
        foodRepository.deleteById(id);
    }

    public void deleteForManager(Long id, Long managerId) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(managerId)
            .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));
        Food food = getById(id);
        if (food.getRestaurant() == null || !food.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Siz faqat o'z restoraningiz taomlarini o'chirishingiz mumkin!");
        }
        foodRepository.delete(food);
    }

    public Food toggleAvailability(Long id) {
        Food food = getById(id);
        food.setAvailable(!food.getAvailable());
        return foodRepository.save(food);
    }

    public Food toggleAvailabilityForManager(Long id, Long managerId) {
        Restaurant restaurant = restaurantRepository.findByOwnerId(managerId)
            .orElseThrow(() -> new RuntimeException("Sizga tegishli restoran topilmadi!"));
        Food food = getById(id);
        if (food.getRestaurant() == null || !food.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Siz faqat o'z restoraningiz taomlarini tahrirlashingiz mumkin!");
        }
        food.setAvailable(!food.getAvailable());
        return foodRepository.save(food);
    }

    // =================== PRIVATE HELPERS ===================

    private Category findCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
            .orElseThrow(() -> new RuntimeException("Kategoriya topilmadi: " + categoryId));
    }

    private Restaurant findRestaurant(Long restaurantId) {
        return restaurantRepository.findById(restaurantId)
            .orElseThrow(() -> new RuntimeException("Restoran topilmadi: " + restaurantId));
    }
}
