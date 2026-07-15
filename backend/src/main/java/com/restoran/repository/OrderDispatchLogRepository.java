package com.restoran.repository;

import com.restoran.entity.OrderDispatchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderDispatchLogRepository extends JpaRepository<OrderDispatchLog, Long> {
    List<OrderDispatchLog> findByOrderIdOrderByLoggedAtDesc(Long orderId);
    List<OrderDispatchLog> findByOrderIdOrderByLoggedAtAsc(Long orderId);
}
