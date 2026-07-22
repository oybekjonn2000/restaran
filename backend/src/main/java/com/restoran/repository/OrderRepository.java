package com.restoran.repository;

import com.restoran.entity.Order;
import com.restoran.entity.OrderStatus;
import com.restoran.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    List<Order> findByCourierOrderByCreatedAtDesc(User courier);
    List<Order> findByStatusOrderByCreatedAtAsc(OrderStatus status);
    List<Order> findAllByOrderByCreatedAtDesc();
    long countByStatus(OrderStatus status);
    boolean existsByCourierAndStatusIn(User courier, List<OrderStatus> statuses);
    long countByCourierAndStatusIn(User courier, List<OrderStatus> statuses);
    List<Order> findByCourierAndStatusIn(User courier, List<OrderStatus> statuses);
    
    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
    long countByRestaurantIdAndStatus(Long restaurantId, OrderStatus status);
}
