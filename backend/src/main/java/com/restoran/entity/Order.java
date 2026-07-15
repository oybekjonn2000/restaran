package com.restoran.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "courier_id")
    private User courier;

    @Column(nullable = false)
    private Double totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    private String deliveryAddress;
    private Double latitude;
    private Double longitude;
    private Double deliveryFee;
    private Double distance;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "attempted_courier_ids", length = 1000)
    private String attemptedCourierIds;

    @Column(length = 500)
    private String note;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(length = 500)
    private String cancelReason;

    @Column(name = "yandex_delivery")
    @Builder.Default
    private Boolean yandexDelivery = false;

    @Column(name = "is_ready")
    @Builder.Default
    private Boolean isReady = false;

    @Column(name = "courier_accepted_at")
    private LocalDateTime courierAcceptedAt;

    @Column(name = "courier_start_latitude")
    private Double courierStartLatitude;

    @Column(name = "courier_start_longitude")
    private Double courierStartLongitude;

    @Column(name = "restaurant_latitude")
    private Double restaurantLatitude;

    @Column(name = "restaurant_longitude")
    private Double restaurantLongitude;

    @Column(name = "courier_arrived_at_restaurant_at")
    private LocalDateTime courierArrivedAtRestaurantAt;

    @Column(name = "distance_to_restaurant")
    @Builder.Default
    private Double distanceToRestaurant = 0.0;

    @Column(name = "eta_to_restaurant")
    private LocalDateTime etaToRestaurant;

    @Column(name = "courier_latitude")
    private Double courierLatitude;

    @Column(name = "courier_longitude")
    private Double courierLongitude;

    @Column(name = "gps_signal_lost")
    @Builder.Default
    private Boolean gpsSignalLost = false;

    @Column(name = "base_fee")
    @Builder.Default
    private Double baseFee = 9000.0;

    @Column(name = "pickup_distance_km")
    @Builder.Default
    private Double pickupDistanceKm = 0.0;

    @Column(name = "delivery_distance_km")
    @Builder.Default
    private Double deliveryDistanceKm = 0.0;

    @Column(name = "pickup_fee")
    @Builder.Default
    private Double pickupFee = 0.0;

    @Column(name = "courier_delivery_fee")
    @Builder.Default
    private Double courierDeliveryFee = 0.0;

    @Column(name = "total_distance_km")
    @Builder.Default
    private Double totalDistanceKm = 0.0;

    @Column(name = "total_earning")
    @Builder.Default
    private Double totalEarning = 0.0;

    @Column(name = "dispatch_attempt")
    @Builder.Default
    private Integer dispatchAttempt = 0;

    @Column(name = "previous_status")
    private String previousStatus;

    @Transient
    private boolean courierActiveOnShift;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (dispatchAttempt == null) {
            dispatchAttempt = 0;
        }
    }
}
