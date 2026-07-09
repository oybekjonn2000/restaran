package com.restoran.repository;

import com.restoran.entity.Restaurant;
import com.restoran.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    Optional<Restaurant> findByOwnerId(Long ownerId);
    Optional<Restaurant> findByOwner(User owner);
    boolean existsByName(String name);
}
