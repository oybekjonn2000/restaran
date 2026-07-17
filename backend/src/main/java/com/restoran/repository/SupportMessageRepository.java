package com.restoran.repository;

import com.restoran.entity.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {
    List<SupportMessage> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
    boolean existsByTicketId(Long ticketId);
    
    @Query("SELECT COUNT(m) FROM SupportMessage m WHERE m.ticket.type = :type AND m.isSeen = false AND m.senderType <> 'admin'")
    long countUnreadMessagesForAdmin(@Param("type") String type);

    @Query("SELECT COUNT(m) FROM SupportMessage m WHERE m.ticket.id = :ticketId AND m.isSeen = false AND m.senderType = 'admin'")
    long countUnreadMessagesForUser(@Param("ticketId") Long ticketId);
}
