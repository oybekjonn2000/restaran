package com.restoran.repository;

import com.restoran.entity.Restaurant;
import com.restoran.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    List<Restaurant> findByOwnerId(Long ownerId);
    List<Restaurant> findByOwner(User owner);
    boolean existsByName(String name);
    List<Restaurant> findByIsActiveTrue();
}
