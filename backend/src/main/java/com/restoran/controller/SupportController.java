package com.restoran.controller;

import com.restoran.entity.SupportMessage;
import com.restoran.entity.SupportTicket;
import com.restoran.entity.User;
import com.restoran.repository.SupportMessageRepository;
import com.restoran.repository.SupportTicketRepository;
import com.restoran.repository.UserRepository;
import com.restoran.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SupportController {

    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final UserRepository userRepository;

    /** Get or create active support ticket for the logged-in user */
    @GetMapping("/ticket/active")
    public ResponseEntity<SupportTicket> getOrCreateActiveTicket(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam String type) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi"));

        List<SupportTicket> activeTickets = supportTicketRepository.findByUserIdAndTypeAndStatusIn(
                user.getId(), type, List.of("open", "in_progress"));

        if (!activeTickets.isEmpty()) {
            return ResponseEntity.ok(activeTickets.get(0));
        }

        // Create a new support ticket
        SupportTicket ticket = SupportTicket.builder()
                .type(type)
                .user(user)
                .status("open")
                .build();
        return ResponseEntity.ok(supportTicketRepository.save(ticket));
    }

    /** Get all messages for a specific ticket */
    @GetMapping("/tickets/{ticketId}/messages")
    public ResponseEntity<List<SupportMessage>> getTicketMessages(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long ticketId) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElse(null);
        if (ticket == null) {
            return ResponseEntity.status(404).build();
        }

        // Security check: Only the owner or Admin can view messages
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !ticket.getUser().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(supportMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId));
    }

    /** Send a message inside a ticket */
    @PostMapping("/tickets/{ticketId}/messages")
    public ResponseEntity<SupportMessage> sendMessage(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long ticketId,
            @RequestBody Map<String, String> body) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElse(null);
        if (ticket == null) {
            return ResponseEntity.status(404).build();
        }

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !ticket.getUser().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).build();
        }

        User sender = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Sender topilmadi"));

        String senderType = isAdmin ? "admin" : ticket.getType(); // "customer", "courier" or "admin"

        SupportMessage message = SupportMessage.builder()
                .ticket(ticket)
                .sender(sender)
                .senderType(senderType)
                .message(body.get("message"))
                .attachment(body.get("attachment")) // could be image/file path
                .isSeen(false)
                .build();

        // If ticket was closed and user replies, reopen it
        if (!isAdmin && "closed".equals(ticket.getStatus())) {
            ticket.setStatus("open");
            supportTicketRepository.save(ticket);
        }

        // Trigger update to updatedAt of ticket
        ticket.setUpdatedAt(java.time.LocalDateTime.now());
        supportTicketRepository.save(ticket);

        return ResponseEntity.ok(supportMessageRepository.save(message));
    }

    /** Mark all messages in a ticket as seen */
    @PutMapping("/tickets/{ticketId}/seen")
    public ResponseEntity<Void> markMessagesAsSeen(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long ticketId) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElse(null);
        if (ticket == null) {
            return ResponseEntity.status(404).build();
        }

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !ticket.getUser().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).build();
        }

        List<SupportMessage> messages = supportMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        boolean changed = false;

        for (SupportMessage msg : messages) {
            if (!msg.isSeen()) {
                if (isAdmin && !msg.getSenderType().equals("admin")) {
                    msg.setSeen(true);
                    changed = true;
                } else if (!isAdmin && msg.getSenderType().equals("admin")) {
                    msg.setSeen(true);
                    changed = true;
                }
            }
        }

        if (changed) {
            supportMessageRepository.saveAll(messages);
        }

        return ResponseEntity.ok().build();
    }

    // ==========================================
    // ADMIN ENDPOINTS
    // ==========================================

    /** Admin: Get all tickets with optional filtering by type, status, and search query */
    @GetMapping("/admin/tickets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SupportTicket>> getAdminTickets(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        
        List<SupportTicket> tickets;
        if (type != null && status != null) {
            tickets = supportTicketRepository.findByTypeAndStatusOrderByUpdatedAtDesc(type, status);
        } else if (type != null) {
            tickets = supportTicketRepository.findByTypeOrderByUpdatedAtDesc(type);
        } else {
            tickets = supportTicketRepository.findAll().stream()
                    .sorted((t1, t2) -> t2.getUpdatedAt().compareTo(t1.getUpdatedAt()))
                    .toList();
        }

        // Filter out empty tickets (tickets with no messages)
        tickets = tickets.stream()
                .filter(t -> supportMessageRepository.existsByTicketId(t.getId()))
                .toList();

        if (search != null && !search.trim().isEmpty()) {
            String lowerSearch = search.toLowerCase();
            tickets = tickets.stream()
                    .filter(t -> (t.getUser().getName() != null && t.getUser().getName().toLowerCase().contains(lowerSearch)) ||
                                 (t.getUser().getPhone() != null && t.getUser().getPhone().toLowerCase().contains(lowerSearch)) ||
                                 (t.getUser().getEmail() != null && t.getUser().getEmail().toLowerCase().contains(lowerSearch)))
                    .toList();
        }

        return ResponseEntity.ok(tickets);
    }

    /** Admin: Change ticket status (open, in_progress, closed) */
    @PutMapping("/admin/tickets/{ticketId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SupportTicket> updateTicketStatus(
            @PathVariable Long ticketId,
            @RequestParam String status) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElse(null);
        if (ticket == null) {
            return ResponseEntity.status(404).build();
        }
        ticket.setStatus(status);
        ticket.setUpdatedAt(java.time.LocalDateTime.now());
        return ResponseEntity.ok(supportTicketRepository.save(ticket));
    }

    /** Admin: Assign ticket to an admin */
    @PutMapping("/admin/tickets/{ticketId}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SupportTicket> assignTicket(
            @PathVariable Long ticketId,
            @RequestParam Long adminId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElse(null);
        if (ticket == null) {
            return ResponseEntity.status(404).build();
        }
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin topilmadi"));
        ticket.setAdmin(admin);
        ticket.setUpdatedAt(java.time.LocalDateTime.now());
        return ResponseEntity.ok(supportTicketRepository.save(ticket));
    }

    /** Admin: Get count of unread messages for admin (optionally filtered by type) */
    @GetMapping("/admin/unread-count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getAdminUnreadCount(@RequestParam(required = false) String type) {
        long count;
        if (type != null) {
            count = supportMessageRepository.countUnreadMessagesForAdmin(type);
        } else {
            count = supportMessageRepository.countUnreadMessagesForAdmin("customer") +
                    supportMessageRepository.countUnreadMessagesForAdmin("courier");
        }
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
}
