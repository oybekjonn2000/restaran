package com.restoran.dto.response;

import com.restoran.entity.OrderGpsTrackPoint;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRouteHistoryDto {

    private Long orderId;
    private LocationDto courierStartLocation;
    private LocationDto restaurantLocation;
    private LocationDto customerLocation;

    private List<OrderGpsTrackPoint> gpsTrackPoints;

    private Double pickupDistanceKm;
    private Double deliveryDistanceKm;
    private Double totalDistanceKm;

    private Integer totalTimeMinutes;
    private Double averageSpeedKmh;

    private String staticMapPreview;
    private boolean completedRoute;

    private LocalDateTime createdAt;
    private LocalDateTime courierAcceptedAt;
    private LocalDateTime deliveredAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LocationDto {
        private Double latitude;
        private Double longitude;
        private String address;
    }
}
