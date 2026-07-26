package com.restoran.service;

import com.restoran.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);
    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    @Getter
    @AllArgsConstructor
    public static class OtpEntry {
        private String code;
        private LocalDateTime expiresAt;
        private boolean verified;

        public void setVerified(boolean verified) {
            this.verified = verified;
        }
    }

    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();

    public String cleanPhone(String phone) {
        if (phone == null) return "";
        String digits = phone.replaceAll("[^0-9+]", "");
        if (!digits.startsWith("+")) {
            if (digits.startsWith("998")) {
                digits = "+" + digits;
            } else if (digits.length() == 9) {
                digits = "+998" + digits;
            }
        }
        return digits;
    }

    public Map<String, Object> sendOtp(String rawPhone, String purpose) {
        return sendOtp(rawPhone, purpose, null);
    }

    public Map<String, Object> sendOtp(String rawPhone, String purpose, Long telegramId) {
        String phone = cleanPhone(rawPhone);
        if (!phone.matches("^\\+998\\d{9}$")) {
            throw new RuntimeException("Telefon raqami noto'g'ri formatda! Masalan: +998901234567");
        }

        String normalizedPurpose = purpose != null ? purpose.trim().toUpperCase() : "REGISTER";

        if ("REGISTER".equals(normalizedPurpose)) {
            if (userRepository.existsByPhone(phone)) {
                throw new RuntimeException("Bu telefon raqami allaqachon ro'yxatdan o'tgan!");
            }
        } else if ("RESET_PASSWORD".equals(normalizedPurpose)) {
            if (!userRepository.existsByPhone(phone)) {
                throw new RuntimeException("Ushbu telefon raqamli foydalanuvchi topilmadi!");
            }
        }

        String code = String.format("%06d", 100000 + random.nextInt(900000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(2);

        String key = phone + ":" + normalizedPurpose;
        otpStorage.put(key, new OtpEntry(code, expiresAt, false));

        logger.info("=== OTP CODE GENERATED FOR {} [{}]: {} ===", phone, normalizedPurpose, code);
        System.out.println("=== OTP CODE GENERATED FOR " + phone + " [" + normalizedPurpose + "]: " + code + " ===");

        return Map.of(
            "message", "Tasdiqlash kodi yuborildi",
            "phone", phone,
            "purpose", normalizedPurpose,
            "expiresInSeconds", 120,
            "devOtpCode", code // Hozircha test va demo uchun kod qaytariladi (SMS provayderga ulangunicha)
        );
    }

    public Map<String, Object> verifyOtp(String rawPhone, String inputCode, String purpose) {
        String phone = cleanPhone(rawPhone);
        String normalizedPurpose = purpose != null ? purpose.trim().toUpperCase() : "REGISTER";
        String key = phone + ":" + normalizedPurpose;

        OtpEntry entry = otpStorage.get(key);
        if (entry == null) {
            throw new RuntimeException("Tasdiqlash kodi topilmadi yoki yuborilmagan!");
        }

        if (LocalDateTime.now().isAfter(entry.getExpiresAt())) {
            otpStorage.remove(key);
            throw new RuntimeException("Tasdiqlash kodi muddati tugagan (2 daqiqa)! Qaytadan kod so'rang.");
        }

        if (!entry.getCode().equals(inputCode != null ? inputCode.trim() : "")) {
            throw new RuntimeException("Tasdiqlash kodi noto'g'ri!");
        }

        entry.setVerified(true);

        return Map.of(
            "message", "Telefon raqami muvaffaqiyatli tasdiqlandi",
            "phone", phone,
            "verified", true
        );
    }

    public boolean isVerified(String rawPhone, String purpose) {
        String phone = cleanPhone(rawPhone);
        String normalizedPurpose = purpose != null ? purpose.trim().toUpperCase() : "REGISTER";
        String key = phone + ":" + normalizedPurpose;

        OtpEntry entry = otpStorage.get(key);
        return entry != null && entry.isVerified() && LocalDateTime.now().isBefore(entry.getExpiresAt().plusMinutes(10));
    }

    public void clearOtp(String rawPhone, String purpose) {
        String phone = cleanPhone(rawPhone);
        String normalizedPurpose = purpose != null ? purpose.trim().toUpperCase() : "REGISTER";
        otpStorage.remove(phone + ":" + normalizedPurpose);
    }
}
