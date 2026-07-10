package com.restoran.service;

import com.restoran.entity.Role;
import com.restoran.entity.Slot;
import com.restoran.entity.User;
import com.restoran.repository.SlotRepository;
import com.restoran.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/** Jarima narxi: 1 soat = 30 000 so'm */
@Service
@RequiredArgsConstructor
@Transactional
public class SlotService {

    private static final long PENALTY_PER_HOUR = 30_000L;

    private final SlotRepository slotRepository;
    private final UserRepository userRepository;
    private final com.restoran.repository.OrderRepository orderRepository;

    // ====== ADMIN AMALLAR ======

    public Slot createSlot(SlotRequest request) {
        User courier = null;
        if (request.getCourierId() != null) {
            courier = userRepository.findById(request.getCourierId())
                .orElseThrow(() -> new RuntimeException("Kuryer topilmadi: " + request.getCourierId()));
            if (courier.getRole() != Role.COURIER) {
                throw new RuntimeException("Foydalanuvchi kuryer emas!");
            }
        }

        Slot slot = Slot.builder()
            .name(request.getName())
            .date(request.getDate())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .courier(courier)
            .started(false)
            .finished(false)
            .cancelled(false)
            .penaltyAmount(0L)
            .penaltyApplied(false)
            .build();

        return slotRepository.save(slot);
    }

    public Slot updateSlot(Long id, SlotRequest request) {
        Slot slot = slotRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Smena topilmadi: " + id));

        User courier = null;
        if (request.getCourierId() != null) {
            courier = userRepository.findById(request.getCourierId())
                .orElseThrow(() -> new RuntimeException("Kuryer topilmadi: " + request.getCourierId()));
            if (courier.getRole() != Role.COURIER) {
                throw new RuntimeException("Foydalanuvchi kuryer emas!");
            }
        }

        slot.setName(request.getName());
        slot.setDate(request.getDate());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setCourier(courier);

        return slotRepository.save(slot);
    }

    public void deleteSlot(Long id) {
        slotRepository.deleteById(id);
    }

    public List<Slot> getAllSlots() {
        return slotRepository.findAllByOrderByDateDescStartTimeAsc();
    }

    public List<Slot> getTodaySlots() {
        return slotRepository.findByDateOrderByStartTimeAsc(LocalDate.now());
    }

    // ====== KURYER AMALLAR ======

    /** Kuryer uchun mavjud smenalar (oldindan band qilsa bo'ladigan) */
    public List<Slot> getAvailableSlotsForCourier(Long courierId) {
        return slotRepository.findAvailableSlotsForCourier(courierId);
    }

    /** Kuryer band qilgan (hali boshlanmagan) smenalar */
    public List<Slot> getBookedSlotsForCourier(Long courierId) {
        return slotRepository.findBookedSlotsForCourier(courierId);
    }

    /** Kuryerga tegishli bo'lgan barcha smenalar */
    public List<Slot> getAllSlotsForCourier(Long courierId) {
        return slotRepository.findAllSlotsForCourier(courierId);
    }

    /**
     * Kuryer smenani OLDINDAN BAND QILADI.
     * Vaqtidan oldin ham bo'lishi mumkin.
     */
    public Slot bookSlot(Long slotId, Long courierId) {
        Slot slot = slotRepository.findById(slotId)
            .orElseThrow(() -> new RuntimeException("Smena topilmadi: " + slotId));

        User courier = userRepository.findById(courierId)
            .orElseThrow(() -> new RuntimeException("Kuryer topilmadi: " + courierId));

        // Allaqachon bekor qilinganmi?
        if (slot.isCancelled()) {
            throw new RuntimeException("Bu smena bekor qilingan!");
        }

        // Allaqachon boshlanganmi?
        if (slot.isStarted()) {
            throw new RuntimeException("Bu smena allaqachon boshlangan!");
        }

        // Boshqa kuryer band qilganmi?
        if (slot.getBookedBy() != null && !slot.getBookedBy().getId().equals(courierId)) {
            throw new RuntimeException("Bu smena allaqachon boshqa kuryer tomonidan band qilingan!");
        }

        // Admin tayinlaganmi va boshqa kuryermi?
        if (slot.getCourier() != null && !slot.getCourier().getId().equals(courierId)) {
            throw new RuntimeException("Bu smena sizga tayinlanmagan!");
        }

        // Kuryer allaqachon boshqa smenani band qilganmi (bir vaqtda bir smena)?
        List<Slot> myBooked = slotRepository.findBookedSlotsForCourier(courierId);
        // Bir vaqtda 3 tagacha band qilish mumkin
        if (myBooked.size() >= 3) {
            throw new RuntimeException("Bir vaqtda 3 tadan ko'p smena band qila olmaysiz!");
        }

        slot.setBookedBy(courier);
        slot.setBookedAt(LocalDateTime.now());

        return slotRepository.save(slot);
    }

    /**
     * Kuryer band qilgan smenani BEKOR QILADI.
     * Jarima = smena_soatlari × 30 000 so'm
     */
    public CancelResult cancelSlot(Long slotId, Long courierId) {
        Slot slot = slotRepository.findById(slotId)
            .orElseThrow(() -> new RuntimeException("Smena topilmadi: " + slotId));

        // Kuryer bu smenani band qilganmi?
        boolean isBookedByCourier = slot.getBookedBy() != null && slot.getBookedBy().getId().equals(courierId);
        boolean isAssignedToCourier = slot.getCourier() != null && slot.getCourier().getId().equals(courierId);

        if (!isBookedByCourier && !isAssignedToCourier) {
            throw new RuntimeException("Bu smena sizga tegishli emas!");
        }

        if (slot.isCancelled()) {
            throw new RuntimeException("Bu smena allaqachon bekor qilingan!");
        }

        if (slot.isStarted()) {
            throw new RuntimeException("Boshlangan smenani bekor qilib bo'lmaydi!");
        }

        // Jarima hisoblash
        long penalty = calculatePenalty(slot);

        slot.setCancelled(true);
        slot.setCancelledAt(LocalDateTime.now());
        slot.setPenaltyAmount(penalty);
        slot.setPenaltyApplied(true);

        User user = slot.getBookedBy() != null ? slot.getBookedBy() : slot.getCourier();
        if (user != null) {
            long currentBalance = user.getBalance() != null ? user.getBalance() : 0L;
            user.setBalance(currentBalance - penalty);
            userRepository.save(user);
        }

        slotRepository.save(slot);

        return new CancelResult(slot, penalty);
    }

    /**
     * Kuryer smenani BOSHLAYDI (vaqt kelganda).
     */
    public Slot startSlot(Long slotId, Long courierId) {
        Slot slot = slotRepository.findById(slotId)
            .orElseThrow(() -> new RuntimeException("Smena topilmadi: " + slotId));

        User courier = userRepository.findById(courierId)
            .orElseThrow(() -> new RuntimeException("Kuryer topilmadi: " + courierId));

        LocalTime now = LocalTime.now();

        if (slot.isCancelled()) {
            throw new RuntimeException("Bu smena bekor qilingan!");
        }

        // Smena bugun uchunmi?
        if (!slot.getDate().equals(LocalDate.now())) {
            throw new RuntimeException("Bu smena bugungi emas! Sana: " + slot.getDate());
        }

        // Vaqt tekshiruvi: hali kelmagan
        if (now.isBefore(slot.getStartTime())) {
            throw new RuntimeException(
                "Smena hali boshlanmagan! Smena vaqti: "
                + slot.getStartTime().toString().substring(0, 5)
                + ". Hozirgi vaqt: "
                + now.toString().substring(0, 5)
            );
        }

        // Vaqt tekshiruvi: o'tib ketgan
        if (now.isAfter(slot.getEndTime())) {
            throw new RuntimeException(
                "Smena vaqti tugagan! Tugash vaqti: "
                + slot.getEndTime().toString().substring(0, 5)
            );
        }

        if (slot.isStarted()) {
            throw new RuntimeException("Bu smena allaqachon boshlangan!");
        }

        // Kuryer bu smenaga haqqi bormi?
        boolean isBookedByCourier = slot.getBookedBy() != null && slot.getBookedBy().getId().equals(courierId);
        boolean isAssignedToCourier = slot.getCourier() != null && slot.getCourier().getId().equals(courierId);
        boolean isOpenSlot = slot.getCourier() == null && slot.getBookedBy() == null;

        if (!isBookedByCourier && !isAssignedToCourier && !isOpenSlot) {
            throw new RuntimeException("Bu smena sizga tayinlanmagan yoki band qilinmagan!");
        }

        // Boshqa aktiv smena bormi?
        Optional<Slot> activeSlot = slotRepository.findActiveSlotForCourier(courierId);
        if (activeSlot.isPresent()) {
            throw new RuntimeException("Sizda allaqachon faol smena bor: " + activeSlot.get().getName());
        }

        slot.setCourier(courier);
        slot.setStarted(true);
        slot.setStartedAt(LocalDateTime.now());

        return slotRepository.save(slot);
    }

    /** Kuryer smenani tugatadi */
    public Slot endSlot(Long slotId, Long courierId) {
        Slot slot = slotRepository.findById(slotId)
            .orElseThrow(() -> new RuntimeException("Smena topilmadi: " + slotId));

        if (slot.getCourier() == null || !slot.getCourier().getId().equals(courierId)) {
            throw new RuntimeException("Bu smena sizniki emas!");
        }

        if (!slot.isStarted()) {
            throw new RuntimeException("Smena hali boshlanmagan!");
        }

        if (slot.isFinished()) {
            throw new RuntimeException("Smena allaqachon tugagan!");
        }

        slot.setFinished(true);
        slot.setFinishedAt(LocalDateTime.now());

        return slotRepository.save(slot);
    }

    /** Kuryer uchun faol smena */
    public Optional<Slot> getActiveSlotForCourier(Long courierId) {
        return slotRepository.findActiveSlotForCourier(courierId);
    }

    /** Kuryer aktiv smenada ekanligini tekshiradi */
    public boolean hasActiveSlot(Long courierId) {
        return slotRepository.findActiveSlotForCourier(courierId).isPresent();
    }

    // ====== JARIMA HISOBLASH ======

    /**
     * Smena muddati asosida jarima hisoblash.
     * 1 soat = 30 000 so'm (to'liq soat bo'lmasa ham to'liq soat hisoblanadi)
     */
    public long calculatePenalty(Slot slot) {
        long minutes = ChronoUnit.MINUTES.between(slot.getStartTime(), slot.getEndTime());
        long hours = (long) Math.ceil((double) minutes / 60.0);
        return hours * PENALTY_PER_HOUR;
    }

    /**
     * Har kuni 00:05 da ishlamagan (no-show) kuryerlarga avtomatik jarima
     */
    @Scheduled(cron = "0 5 0 * * *")
    public void applyNoShowPenalties() {
        List<Slot> noShowSlots = slotRepository.findNoShowSlots(LocalDate.now());
        for (Slot slot : noShowSlots) {
            long penalty = calculatePenalty(slot);
            slot.setPenaltyAmount(penalty);
            slot.setPenaltyApplied(true);
            slot.setCancelled(true);
            slot.setCancelledAt(LocalDateTime.now());

            User user = slot.getBookedBy();
            if (user != null) {
                long currentBalance = user.getBalance() != null ? user.getBalance() : 0L;
                user.setBalance(currentBalance - penalty);
                userRepository.save(user);
            }

            slotRepository.save(slot);
        }
    }

    /**
     * Har 5 soniyada faol smenalarni tekshiradi.
     * Agar smena vaqti tugagan bo'lsa va kuryerda faol buyurtma bo'lmasa, smenani avtomatik tugatadi.
     */
    @Scheduled(fixedDelay = 5000)
    public void autoCloseExpiredSlots() {
        List<Slot> activeSlots = slotRepository.findByStartedTrueAndFinishedFalse();
        LocalTime nowTime = LocalTime.now();
        LocalDate nowDate = LocalDate.now();

        List<com.restoran.entity.OrderStatus> activeStatuses = List.of(
            com.restoran.entity.OrderStatus.PREPARING,
            com.restoran.entity.OrderStatus.COURIER_ACCEPTED,
            com.restoran.entity.OrderStatus.COURIER_AT_RESTAURANT,
            com.restoran.entity.OrderStatus.DELIVERING,
            com.restoran.entity.OrderStatus.COURIER_AT_CLIENT
        );

        for (Slot slot : activeSlots) {
            boolean isExpired = nowDate.isAfter(slot.getDate()) || 
                               (nowDate.equals(slot.getDate()) && nowTime.isAfter(slot.getEndTime()));
            if (isExpired) {
                boolean hasActiveOrders = false;
                if (slot.getCourier() != null) {
                    hasActiveOrders = orderRepository.existsByCourierAndStatusIn(slot.getCourier(), activeStatuses);
                }
                if (!hasActiveOrders) {
                    slot.setFinished(true);
                    slot.setFinishedAt(LocalDateTime.now());
                    slotRepository.save(slot);
                    System.out.println(">>> Smena vaqti tugadi va faol buyurtmalar yo'qligi uchun #" + slot.getId() + " smena yopildi.");
                }
            }
        }
    }

    // ====== DTO ======

    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SlotRequest {
        private String name;
        private LocalDate date;
        private java.time.LocalTime startTime;
        private java.time.LocalTime endTime;
        private Long courierId; // null = ochiq smena
    }

    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class CancelResult {
        private Slot slot;
        private long penaltyAmount;
    }
}
