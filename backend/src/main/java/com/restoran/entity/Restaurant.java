package com.restoran.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "restaurants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String imageUrl;

    private String address;

    private Double latitude;

    private Double longitude;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    public boolean isActive() {
        return this.isActive;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    public void setActive(boolean isActive) {
        this.isActive = isActive;
    }
}
