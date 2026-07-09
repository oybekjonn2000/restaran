package com.restoran.service;

import com.restoran.entity.Category;
import com.restoran.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    public Category getById(Long id) {
        return categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Kategoriya topilmadi: " + id));
    }

    public Category create(String name, String imageUrl) {
        Category category = Category.builder()
            .name(name)
            .imageUrl(imageUrl)
            .build();
        return categoryRepository.save(category);
    }

    public Category update(Long id, String name, String imageUrl) {
        Category category = getById(id);
        category.setName(name);
        category.setImageUrl(imageUrl);
        return categoryRepository.save(category);
    }

    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }
}
