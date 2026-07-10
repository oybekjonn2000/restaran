package com.restoran.repository;

import com.restoran.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SlotRepository extends JpaRepository<Slot, Long> {

    /** Berilgan kunga tegishli barcha smenalar */
    List<Slot> findByDateOrderByStartTimeAsc(LocalDate date);

    /**
     * Kuryer uchun mavjud smenalar — o'ziga tayinlangan YOKI ochiq (courier=null) YOKI o'zi band qilgan.
     * Bekor qilinmagan smenalar.
     */
    @Query("""
        SELECT s FROM Slot s WHERE
          s.cancelled = false AND
          s.finished = false AND
          (
            (s.courier IS NULL AND s.bookedBy IS NULL)
            OR s.courier.id = :courierId
            OR s.bookedBy.id = :courierId
          )
        ORDER BY s.date ASC, s.startTime ASC
    """)
    List<Slot> findAvailableSlotsForCourier(@Param("courierId") Long courierId);

    /** Kuryer band qilgan (lekin hali boshlanmagan) smenalar */
    @Query("""
        SELECT s FROM Slot s WHERE
          s.bookedBy.id = :courierId AND
          s.started = false AND
          s.cancelled = false
        ORDER BY s.date ASC, s.startTime ASC
    """)
    List<Slot> findBookedSlotsForCourier(@Param("courierId") Long courierId);

    /** Kuryerga tegishli bo'lgan barcha smenalar (aktiv, band qilingan, yakunlangan va bekor qilingan) */
    @Query("""
        SELECT s FROM Slot s WHERE
          s.courier.id = :courierId OR
          s.bookedBy.id = :courierId
        ORDER BY s.date DESC, s.startTime DESC
    """)
    List<Slot> findAllSlotsForCourier(@Param("courierId") Long courierId);

    /** Kuryer uchun boshlangan, tugallanmagan aktiv smena */
    @Query("SELECT s FROM Slot s WHERE s.courier.id = :courierId AND s.started = true AND s.finished = false")
    Optional<Slot> findActiveSlotForCourier(@Param("courierId") Long courierId);

    /** Kuryer uchun hamma smenalar (bugun) */
    @Query("SELECT s FROM Slot s WHERE s.date = :date AND s.courier.id = :courierId")
    List<Slot> findByDateAndCourierId(@Param("date") LocalDate date, @Param("courierId") Long courierId);

    /** Barcha smenalar descending tartibda */
    List<Slot> findAllByOrderByDateDescStartTimeAsc();

    /** Boshlangan lekin tugallanmagan faol smenalar */
    List<Slot> findByStartedTrueAndFinishedFalse();

    /** Jarima qo'llanilmagan, vaqti o'tib ketgan, boshlash bo'lmagan, bekor qilinmagan band smenalar */
    @Query("""
        SELECT s FROM Slot s WHERE
          s.bookedBy IS NOT NULL AND
          s.started = false AND
          s.cancelled = false AND
          s.penaltyApplied = false AND
          s.date < :today
    """)
    List<Slot> findNoShowSlots(@Param("today") LocalDate today);
}
