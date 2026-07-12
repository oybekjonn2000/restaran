package com.restoran.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Slot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /** Admin tomonidan tayinlangan kuryer (null = ochiq) */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "courier_id")
    private User courier;

    /** Oldindan band qilgan kuryer */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "booked_by_id")
    private User bookedBy;

    /** Band qilingan vaqt */
    @Column(name = "booked_at")
    private LocalDateTime bookedAt;

    /** Kuryer smenani boshladi (vaqt keldi, ishga kirdi) */
    @Column(name = "is_started", nullable = false)
    @Builder.Default
    private boolean started = false;

    /** Smena tugadi */
    @Column(name = "is_finished", nullable = false)
    @Builder.Default
    private boolean finished = false;

    /** Bekor qilinganmi */
    @Column(name = "is_cancelled", nullable = false)
    @Builder.Default
    private boolean cancelled = false;

    /** Bekor qilish jarima summasi (so'mda) */
    @Column(name = "penalty_amount")
    @Builder.Default
    private Long penaltyAmount = 0L;

    /** Jarima qo'llanilganmi */
    @Column(name = "penalty_applied", nullable = false)
    @Builder.Default
    private boolean penaltyApplied = false;

    /** Jarima qo'llanilgan kuryer (smena bekor bo'lsa yoki no-show bo'lsa) */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "penalized_courier_id")
    private User penalizedCourier;

    /** Jarima qo'llanilgan vaqt */
    @Column(name = "penalized_at")
    private LocalDateTime penalizedAt;

    /** Jarima admin tomonidan qaytarilganmi */
    @Column(name = "penalty_reversed", nullable = false)
    @Builder.Default
    private boolean penaltyReversed = false;

    /** Qaytarilgan jarima summasi (asl jarima miqdori) */
    @Column(name = "penalty_reversed_amount")
    @Builder.Default
    private Long penaltyReversedAmount = 0L;

    /** Smenani boshlagan vaqt */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /** Smenani tugatgan vaqt */
    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    /** Bekor qilish vaqti */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
