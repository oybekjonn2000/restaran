package com.restoran.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_dispatch_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDispatchLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    private Long courierId;
    
    private String courierName;
    
    private LocalDateTime sentAt;
    
    private Integer attemptNumber;
    
    private Boolean accepted;
    
    private String declinedBy;
    
    private String cancellationRequestedBy;
    
    private String adminDecision;
    
    private Boolean sentToYandex;
    
    private LocalDateTime loggedAt;

    @Column(length = 2000)
    private String actionDescription;

    @PrePersist
    protected void onCreate() {
        if (loggedAt == null) {
            loggedAt = LocalDateTime.now();
        }
    }
}
