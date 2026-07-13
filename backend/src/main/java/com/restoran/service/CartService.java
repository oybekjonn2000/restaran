package com.restoran.service;

import com.restoran.entity.CartItem;
import com.restoran.entity.Food;
import com.restoran.entity.User;
import com.restoran.repository.CartItemRepository;
import com.restoran.repository.FoodRepository;
import com.restoran.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final FoodRepository foodRepository;

    public List<CartItem> getCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi: " + userId));
        return cartItemRepository.findByUser(user);
    }

    public List<CartItem> syncCart(Long userId, List<CartItemDto> items) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi: " + userId));

        // Delete old cart items
        cartItemRepository.deleteByUser(user);

        List<CartItem> savedItems = new ArrayList<>();
        if (items != null) {
            for (CartItemDto itemDto : items) {
                if (itemDto.getFoodId() == null || itemDto.getQuantity() == null || itemDto.getQuantity() <= 0) {
                    continue;
                }
                Food food = foodRepository.findById(itemDto.getFoodId())
                        .orElse(null);
                if (food == null) {
                    // Try to fetch food, if not found, just skip
                    continue;
                }
                CartItem cartItem = CartItem.builder()
                        .user(user)
                        .food(food)
                        .quantity(itemDto.getQuantity())
                        .build();
                savedItems.add(cartItemRepository.save(cartItem));
            }
        }
        return savedItems;
    }

    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CartItemDto {
        private Long foodId;
        private Integer quantity;
    }
}
