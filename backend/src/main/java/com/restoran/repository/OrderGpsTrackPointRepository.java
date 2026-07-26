package com.restoran.repository;

import com.restoran.entity.OrderGpsTrackPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderGpsTrackPointRepository extends JpaRepository<OrderGpsTrackPoint, Long> {
    List<OrderGpsTrackPoint> findByOrderIdOrderByTimestampAsc(Long orderId);
}
