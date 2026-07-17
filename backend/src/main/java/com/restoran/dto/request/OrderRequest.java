package com.restoran.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    private String deliveryAddress;
    private Double latitude;
    private Double longitude;
    private Double distance;
    private Double deliveryFee;
    private String note;
    private Long restaurantId;
    private String paymentMethod;

    @NotNull
    private List<OrderItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {
        @NotNull
        private Long foodId;

        @NotNull
        @Positive
        private Integer quantity;
    }
}
