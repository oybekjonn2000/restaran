package com.restoran.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FoodRequest {

    @NotBlank(message = "Taom nomi bo'sh bo'lmasin")
    private String name;

    private String description;

    @NotNull(message = "Narx kiritilishi shart")
    @Positive(message = "Narx musbat bo'lishi kerak")
    private Double price;

    private String imageUrl;

    private Boolean available = true;

    @NotNull(message = "Kategoriya tanlanishi shart")
    private Long categoryId;
}
