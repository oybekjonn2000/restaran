package com.restoran.repository;

import com.restoran.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByUserIdAndTypeAndStatusIn(Long userId, String type, List<String> statuses);
    List<SupportTicket> findByTypeOrderByUpdatedAtDesc(String type);
    List<SupportTicket> findByTypeAndStatusOrderByUpdatedAtDesc(String type, String status);
    List<SupportTicket> findByUserIdOrderByUpdatedAtDesc(Long userId);
}
