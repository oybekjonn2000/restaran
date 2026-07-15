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
import java.time.ZoneId;
import java.time.ZonedDateTime;
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
        // Asia/Tashkent vaqt mintaqasida hozirgi vaqt
        ZoneId zone = ZoneId.of("Asia/Tashkent");
        LocalDateTime now = ZonedDateTime.now(zone).toLocalDateTime();

        LocalDateTime startDateTime = LocalDateTime.of(request.getDate(), request.getStartTime());
        LocalDateTime endDateTime;
        if (request.getEndDate() != null) {
            endDateTime = LocalDateTime.of(request.getEndDate(), request.getEndTime());
        } else if (request.getEndTime().isBefore(request.getStartTime()) || request.getEndTime().equals(request.getStartTime())) {
            endDateTime = LocalDateTime.of(request.getDate().plusDays(1), request.getEndTime());
        } else {
            endDateTime = LocalDateTime.of(request.getDate(), request.getEndTime());
        }

        // Boshlanish vaqti o'tib ketgan bo'lsa xato
        if (startDateTime.isBefore(now)) {
            throw new RuntimeException("Boshlanish vaqti o'tib ketgan! (Smena boshlanishi: " + startDateTime + ", Serverdagi Tashkent vaqti: " + now + ")");
        }
        // Tugash vaqti boshlanishdan oldin bo'lsa xato
        if (!endDateTime.isAfter(startDateTime)) {
            throw new RuntimeException("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak! (Smena: " + startDateTime + " - " + endDateTime + ")");
        }

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
            .endDate(request.getEndDate() != null ? request.getEndDate() : endDateTime.toLocalDate())
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

        ZoneId zone = ZoneId.of("Asia/Tashkent");
        LocalDateTime now = ZonedDateTime.now(zone).toLocalDateTime();
        LocalDateTime startDateTime = LocalDateTime.of(request.getDate(), request.getStartTime());
        LocalDateTime endDateTime;
        if (request.getEndDate() != null) {
            endDateTime = LocalDateTime.of(request.getEndDate(), request.getEndTime());
        } else if (request.getEndTime().isBefore(request.getStartTime()) || request.getEndTime().equals(request.getStartTime())) {
            endDateTime = LocalDateTime.of(request.getDate().plusDays(1), request.getEndTime());
        } else {
            endDateTime = LocalDateTime.of(request.getDate(), request.getEndTime());
        }

        if (startDateTime.isBefore(now)) {
            throw new RuntimeException("Boshlanish vaqti o'tib ketgan! (Smena boshlanishi: " + startDateTime + ", Serverdagi Tashkent vaqti: " + now + ")");
        }
        if (!endDateTime.isAfter(startDateTime)) {
            throw new RuntimeException("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak! (Smena: " + startDateTime + " - " + endDateTime + ")");
        }

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
        slot.setEndDate(request.getEndDate() != null ? request.getEndDate() : endDateTime.toLocalDate());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setCourier(courier);

        return slotRepository.save(slot);
    }

    public void deleteSlot(Long id) {
        Slot slot = slotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Smena topilmadi! ID: " + id));

        if (slot.isFinished()) {
            throw new RuntimeException("Yakunlangan smenani o'chirib bo'lmaydi!");
        }
        if (slot.getCourier() != null || slot.getBookedBy() != null) {
            throw new RuntimeException("Kuryer tanlagan yoki biriktirilgan smenani o'chirib bo'lmaydi!");
        }

        slotRepository.delete(slot);
    }

    public List<Slot> getAllSlots() {
        return slotRepository.findAllByOrderByDateDescStartTimeAsc();
    }

    public List<Slot> getTodaySlots() {
        return slotRepository.findByDateOrderByStartTimeAsc(LocalDate.now());
    }

    /**
     * ADMIN: Jarimani bekor qiladi — kuryerning balansiga jarima summasi qaytariladi.
     */
    public Slot reversePenalty(Long slotId) {
        Slot slot = slotRepository.findById(slotId)
            .orElseThrow(() -> new RuntimeException("Smena topilmadi: " + slotId));

        if (!slot.isPenaltyApplied()) {
            throw new RuntimeException("Bu smenada qo'llanilgan jarima yo'q!");
        }

        User penalizedCourier = slot.getPenalizedCourier();
        if (penalizedCourier == null) {
            throw new RuntimeException("Jarimani kim to'laganini aniqlab bo'lmadi!");
        }

        long amount = slot.getPenaltyAmount();
        long currentBalance = penalizedCourier.getBalance() != null ? penalizedCourier.getBalance() : 0L;
        penalizedCourier.setBalance(currentBalance + amount);
        userRepository.save(penalizedCourier);

        // Jarimani bekor qilingan deb belgilaymiz (asl miqdorni saqlaymiz, ko'rsatish uchun)
        slot.setPenaltyReversedAmount(amount);  // asl jarima miqdori
        slot.setPenaltyReversed(true);
        slot.setPenaltyApplied(false);
        // penaltyAmount ni 0 ga o'chirmaymiz — frontend ko'rsatishi uchun saqlaymiz
        slot.setPenalizedCourier(null);
        slot.setPenalizedAt(null);

        return slotRepository.save(slot);
    }

    // ====== KURYER AMALLAR ======

    /** Kuryer uchun mavjud smenalar (oldindan band qilsa bo'ladigan) */
    public List<Slot> getAvailableSlotsForCourier(Long courierId) {
        List<Slot> rawAvailable = slotRepository.findAvailableSlotsForCourier(courierId);
        
        // Kuryerning haqiqatan faol/band qilingan smenalari
        // (jarima qo'llanilgan yoki qaytarilgan smenalar — endi kuryer uchun bog'liq emas, jadvalda ko'rinishi kerak)
        List<Slot> mySlots = slotRepository.findAllSlotsForCourier(courierId).stream()
            .filter(s -> !s.isCancelled() && !s.isFinished() && !s.isPenaltyApplied() && !s.isPenaltyReversed())
            .toList();

        // Agar kuryerda faol/band qilingan smena bo'lsa, kesishadigan boshqa ochiq smenalarni ro'yxatdan olib tashlaymiz
        return rawAvailable.stream()
            .filter(slot -> {
                // Agar smena kuryerning o'ziga tegishli bo'lsa, ro'yxatda tursin
                boolean isMine = (slot.getCourier() != null && slot.getCourier().getId().equals(courierId)) || 
                                 (slot.getBookedBy() != null && slot.getBookedBy().getId().equals(courierId));
                if (isMine) {
                    return true;
                }

                // Agar boshqa ochiq smena bo'lsa, kuryerning o'z smenalari bilan kesishmasligini tekshiramiz
                for (Slot mySlot : mySlots) {
                    boolean overlaps = slot.getStartDateTime().isBefore(mySlot.getEndDateTime()) &&
                                       mySlot.getStartDateTime().isBefore(slot.getEndDateTime());
                    if (overlaps) {
                        return false; // Vaqti kesishsa, ro'yxatda ko'rsatmaymiz
                    }
                }
                return true;
            })
            .toList();
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

        // Smenani o'tmishda emasligini tekshirish
        ZoneId zone = ZoneId.of("Asia/Tashkent");
        LocalDateTime now = ZonedDateTime.now(zone).toLocalDateTime();
        if (slot.getStartDateTime().isBefore(now)) {
            throw new RuntimeException("O'tib ketgan smenani band qilib bo'lmaydi!");
        }

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

        // Bir xil vaqtli yoki kesishadigan smenalarni tekshirish (overlap check)
        List<Slot> courierDailySlots = slotRepository.findAll().stream()
            .filter(s -> !s.getId().equals(slot.getId()))
            .filter(s -> !s.isCancelled() && !s.isFinished())
            .filter(s -> (s.getCourier() != null && s.getCourier().getId().equals(courierId)) || 
                         (s.getBookedBy() != null && s.getBookedBy().getId().equals(courierId)))
            .toList();

        for (Slot existingSlot : courierDailySlots) {
            boolean overlaps = slot.getStartDateTime().isBefore(existingSlot.getEndDateTime()) &&
                               existingSlot.getStartDateTime().isBefore(slot.getEndDateTime());
            if (overlaps) {
                throw new RuntimeException("Ushbu vaqt oralig'ida sizda boshqa faol yoki band qilingan smena mavjud (" 
                    + existingSlot.getStartTime().toString().substring(0, 5) + " - " 
                    + existingSlot.getEndTime().toString().substring(0, 5) + ")!");
            }
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
        // Jarima hisoblash: Smenaga chiqishga 12 soatdan kam vaqt qolgan bo'lsagina jarima qo'llaniladi
        LocalDateTime startDateTime = slot.getStartDateTime();
        LocalDateTime nowDateTime = LocalDateTime.now();
        long hoursUntilStart = ChronoUnit.HOURS.between(nowDateTime, startDateTime);

        long penalty = 0L;
        if (hoursUntilStart < 12) {
            penalty = calculatePenalty(slot);
        }

        // Jarimani kuryerning balansidan ayiramiz
        User user = slot.getBookedBy() != null ? slot.getBookedBy() : slot.getCourier();
        if (user != null && penalty > 0) {
            long currentBalance = user.getBalance() != null ? user.getBalance() : 0L;
            user.setBalance(currentBalance - penalty);
            userRepository.save(user);
        }

        // Smenani ochiq holatga qaytaramiz (bekor qilmaymiz!)
        slot.setCancelled(false);
        slot.setBookedBy(null);
        slot.setBookedAt(null);
        slot.setCourier(null);
        slot.setCancelledAt(null);

        // Jarima hisobi saqlanadi
        slot.setPenaltyAmount(penalty);
        slot.setPenaltyApplied(penalty > 0);
        if (penalty > 0) {
            slot.setPenalizedCourier(user);
            slot.setPenalizedAt(LocalDateTime.now());
        } else {
            slot.setPenalizedCourier(null);
            slot.setPenalizedAt(null);
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

        LocalDateTime startDateTime = slot.getStartDateTime();
        LocalDateTime endDateTime = slot.getEndDateTime();
        LocalDateTime nowDateTime = LocalDateTime.now();

        // Smena tugash vaqti o'tib ketgan bo'lsa
        if (nowDateTime.isAfter(endDateTime)) {
            throw new RuntimeException("Smena vaqti allaqachon tugagan!");
        }

        // Hali boshlanish vaqti kelmagan bo'lsa (15 daqiqa oldin ham boshlash mumkin)
        if (nowDateTime.isBefore(startDateTime.minusMinutes(15))) {
            throw new RuntimeException(
                "Smena hali boshlanmagan! Boshlanish vaqti: " + slot.getStartTime().toString().substring(0, 5)
            );
        }

        // Boshlanish vaqtidan 2 soat o'tib ketgan bo'lsa
        if (nowDateTime.isAfter(startDateTime.plusHours(2))) {
            throw new RuntimeException("Smenaga chiqish vaqti 2 soatdan o'tib ketdi!");
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

    /**
     * ADMIN: Kuryerning smenasini majburiy tugatadi.
     * Kuryerni tekshirmaydi — admin istalgan faol smenani tugatishi mumkin.
     */
    public Slot adminForceEndSlot(Long slotId) {
        Slot slot = slotRepository.findById(slotId)
            .orElseThrow(() -> new RuntimeException("Smena topilmadi: " + slotId));

        if (!slot.isStarted()) {
            throw new RuntimeException("Smena hali boshlanmagan — tugatib bo'lmaydi!");
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
        long minutes = ChronoUnit.MINUTES.between(slot.getStartDateTime(), slot.getEndDateTime());
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
        LocalDateTime now = LocalDateTime.now();
        List<com.restoran.entity.OrderStatus> activeStatuses = List.of(
            com.restoran.entity.OrderStatus.PREPARING,
            com.restoran.entity.OrderStatus.COURIER_ACCEPTED,
            com.restoran.entity.OrderStatus.COURIER_AT_RESTAURANT,
            com.restoran.entity.OrderStatus.DELIVERING,
            com.restoran.entity.OrderStatus.COURIER_AT_CLIENT
        );

        for (Slot slot : activeSlots) {
            boolean isExpired = now.isAfter(slot.getEndDateTime());
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

    /**
     * Har 5 soniyada boshlanmagan smenalarni tekshiradi.
     * Agar boshlanish vaqtidan 1 soat o'tgan bo'lsa, smenani avtomatik bekor qiladi va jarimalaydi.
     */
    @Scheduled(fixedDelay = 5000)
    public void cancelNoShowSlotsRealtime() {
        List<Slot> pendingSlots = slotRepository.findByStartedFalseAndCancelledFalseAndFinishedFalse();
        LocalDateTime now = LocalDateTime.now();
        for (Slot slot : pendingSlots) {
            // Faqat kuryer band qilgan yoki biriktirilgan smenalarni tekshiramiz
            if (slot.getBookedBy() == null && slot.getCourier() == null) continue;

            LocalDateTime startDateTime = slot.getStartDateTime();
            if (now.isAfter(startDateTime.plusHours(2))) {
                System.out.println(">>> Auto no-show: #" + slot.getId() + " smenaga 2 soat davomida chiqilmadi. Jarima qo'llanilmoqda, smena qayta ochilmoqda...");
                long penalty = calculatePenalty(slot);

                // Jarimani kuryerga yozamiz
                User user = slot.getBookedBy() != null ? slot.getBookedBy() : slot.getCourier();
                if (user != null && penalty > 0) {
                    long currentBalance = user.getBalance() != null ? user.getBalance() : 0L;
                    user.setBalance(currentBalance - penalty);
                    userRepository.save(user);
                }

                // Smenani ochiq holatga qaytaramiz
                slot.setBookedBy(null);
                slot.setBookedAt(null);
                slot.setCourier(null);
                slot.setCancelled(false);
                slot.setCancelledAt(null);
                slot.setPenaltyAmount(penalty);
                // Har doim penaltyApplied=true qilamiz (0 bo'lsa ham), shunda deleteExpiredSlots o'chirmaydi
                slot.setPenaltyApplied(true);
                slot.setPenalizedCourier(user);
                slot.setPenalizedAt(now);

                slotRepository.save(slot);
            }
        }
    }

    /**
     * Har 10 soniyada vaqti o'tgan smenalarni avtomatik o'chiradi.
     * Faqat faol bo'lmagan (started=true va finished=false bo'lmagan) va faol jarimasi bo'lmagan smenalar o'chiriladi.
     */
    @Scheduled(fixedDelay = 10000)
    public void deleteExpiredSlots() {
        List<Slot> allSlots = slotRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        for (Slot slot : allSlots) {
            LocalDateTime startDateTime = slot.getStartDateTime();
            LocalDateTime endDateTime = slot.getEndDateTime();

            // 1-holat: Smenaning tugash vaqti o'tib ketgan bo'lsa
            if (now.isAfter(endDateTime)) {
                // Hali tugallanmagan faol smenalarni o'chirmaymiz (autoCloseExpiredSlots yopguncha kutamiz)
                if (slot.isStarted() && !slot.isFinished()) {
                    continue;
                }
                // Faol jarimasi bor smenalarni o'chirmaymiz (admin bekor qilishi uchun imkoniyat qolishi kerak)
                if (slot.isPenaltyApplied()) {
                    continue;
                }
                slotRepository.delete(slot);
                continue;
            }

            // 2-holat: Smenaning boshlanish vaqtidan 2.5 soat o'tgan bo'lsa va hech kim band qilmagan ochiq smena
            // cancelNoShowSlotsRealtime avval 2 soatda ishlab, kuryer bo'lsa penaltyApplied=true qiladi.
            // Shuning uchun faqat 2.5 soatdan keyin penaltyApplied=false (chinakam ochiq) smenalarni o'chiramiz.
            if (now.isAfter(startDateTime.plusMinutes(150))) {
                if (slot.getCourier() == null && slot.getBookedBy() == null && !slot.isStarted()) {
                    if (!slot.isPenaltyApplied()) {
                        slotRepository.delete(slot);
                    }
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
        private LocalDate endDate;
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
