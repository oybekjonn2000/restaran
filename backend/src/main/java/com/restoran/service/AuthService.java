package com.restoran.service;

import com.restoran.dto.request.LoginRequest;
import com.restoran.dto.request.RegisterRequest;
import com.restoran.dto.request.ProfileUpdateRequest;
import com.restoran.dto.request.ResetPasswordOtpRequest;
import com.restoran.dto.response.AuthResponse;
import com.restoran.entity.Role;
import com.restoran.entity.User;
import com.restoran.repository.UserRepository;
import com.restoran.security.JwtUtils;
import com.restoran.security.UserDetailsImpl;
import com.restoran.dto.request.TelegramUser;
import com.restoran.security.TelegramUtils;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final TelegramUtils telegramUtils;
    private final OtpService otpService;

    public AuthResponse login(LoginRequest request) {
        String identifier = (request.getPhone() != null && !request.getPhone().isBlank())
            ? otpService.cleanPhone(request.getPhone())
            : request.getEmail();

        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        boolean rememberMe = request.getRememberMe() != null && request.getRememberMe();
        
        // Token JWT identifier sifatida foydalanuvchining telefon raqami yoki email'i ishlatiladi
        User user = userRepository.findByPhone(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi"));

        String jwtSubject = (user.getPhone() != null && !user.getPhone().isBlank()) ? user.getPhone() : user.getEmail();
        String token = jwtUtils.generateToken(jwtSubject, rememberMe);

        final Long currentUserId = user.getId();
        if (request.getInitData() != null && !request.getInitData().isEmpty()) {
            if (telegramUtils.verifyInitData(request.getInitData())) {
                TelegramUser tgUser = telegramUtils.parseUser(request.getInitData());
                if (tgUser != null && tgUser.getId() != null) {
                    userRepository.findByTelegramId(tgUser.getId()).ifPresent(existing -> {
                        if (!existing.getId().equals(currentUserId)) {
                            existing.setTelegramId(null);
                            userRepository.save(existing);
                        }
                    });
                    user.setTelegramId(tgUser.getId());
                    user = userRepository.save(user);
                }
            }
        }

        return buildAuthResponse(token, user);
    }

    public AuthResponse register(RegisterRequest request) {
        Role role = Role.CLIENT;
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                role = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        String phone = (request.getPhone() != null && !request.getPhone().isBlank())
            ? otpService.cleanPhone(request.getPhone())
            : null;

        // CLIENT ro'yxatdan o'tishida OTP tekshirish (Admin/Manager yaratganda ixtiyoriy bo'lishi mumkin)
        if (role == Role.CLIENT) {
            if (phone == null || phone.isBlank()) {
                throw new RuntimeException("Telefon raqami kiritilishi shart!");
            }
            if (!otpService.isVerified(phone, "REGISTER")) {
                throw new RuntimeException("Telefon raqami tasdiqlanmagan! Avval SMS kodni tasdiqlang.");
            }
            if (userRepository.existsByPhone(phone)) {
                throw new RuntimeException("Bu telefon raqami allaqachon ro'yxatdan o'tgan!");
            }
            // Parol murakkabligini tekshirish
            String pwd = request.getPassword();
            if (pwd == null || pwd.length() < 8 || !pwd.matches(".*[A-Z].*") || !pwd.matches(".*[a-z].*") || !pwd.matches(".*[0-9].*")) {
                throw new RuntimeException("Parol kamida 8 ta belgi, 1 ta katta harf, 1 ta kichik harf va 1 ta raqamdan iborat bo'lishi kerak!");
            }
        }

        String name = (request.getName() != null ? request.getName().trim() : "");
        if (request.getSurname() != null && !request.getSurname().isBlank()) {
            name = name + " " + request.getSurname().trim();
        }
        if (name.isBlank()) {
            name = "Mijoz";
        }

        // Email ixtiyoriy
        String email = (request.getEmail() != null && !request.getEmail().isBlank())
            ? request.getEmail().trim()
            : null;

        if (email != null && userRepository.existsByEmail(email)) {
            throw new RuntimeException("Bu email allaqachon ro'yxatdan o'tgan!");
        }

        // Manzilni shakllantirish
        StringBuilder addressBuilder = new StringBuilder();
        if (request.getAddress() != null && !request.getAddress().isBlank()) {
            addressBuilder.append(request.getAddress().trim());
        }
        if (request.getHouse() != null && !request.getHouse().isBlank()) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(request.getHouse().trim()).append("-uy");
        }
        if (request.getEntrance() != null && !request.getEntrance().isBlank()) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(request.getEntrance().trim()).append("-kirish");
        }
        if (request.getFloor() != null && !request.getFloor().isBlank()) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(request.getFloor().trim()).append("-qavat");
        }
        if (request.getApartment() != null && !request.getApartment().isBlank()) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(request.getApartment().trim()).append("-xonadon");
        }
        String fullAddress = addressBuilder.length() > 0 ? addressBuilder.toString() : null;

        User user = User.builder()
            .name(name)
            .email(email)
            .password(passwordEncoder.encode(request.getPassword()))
            .phone(phone)
            .address(fullAddress)
            .role(role)
            .build();

        user = userRepository.save(user);

        if (phone != null) {
            otpService.clearOtp(phone, "REGISTER");
        }

        String jwtSubject = (phone != null) ? phone : (email != null ? email : user.getId().toString());
        String token = jwtUtils.generateToken(jwtSubject);

        return buildAuthResponse(token, user);
    }

    public void resetPasswordWithOtp(ResetPasswordOtpRequest request) {
        String phone = otpService.cleanPhone(request.getPhone());
        if (!otpService.isVerified(phone, "RESET_PASSWORD")) {
            throw new RuntimeException("Telefon raqami uchun SMS kod tasdiqlanmagan!");
        }

        String pwd = request.getNewPassword();
        if (pwd == null || pwd.length() < 8 || !pwd.matches(".*[A-Z].*") || !pwd.matches(".*[a-z].*") || !pwd.matches(".*[0-9].*")) {
            throw new RuntimeException("Parol kamida 8 ta belgi, 1 ta katta harf, 1 ta kichik harf va 1 ta raqamdan iborat bo'lishi kerak!");
        }

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("Ushbu telefon raqamli foydalanuvchi topilmadi!"));

        user.setPassword(passwordEncoder.encode(pwd));
        userRepository.save(user);

        otpService.clearOtp(phone, "RESET_PASSWORD");
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        return AuthResponse.builder()
            .token(token)
            .type("Bearer")
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .role(user.getRole().name())
            .phone(user.getPhone())
            .address(user.getAddress())
            .balance(user.getBalance())
            .build();
    }

    public AuthResponse loginWithTelegram(String initData) {
        if (!telegramUtils.verifyInitData(initData)) {
            throw new RuntimeException("Telegram ma'lumotlari haqiqiy emas!");
        }

        TelegramUser tgUser = telegramUtils.parseUser(initData);
        if (tgUser == null || tgUser.getId() == null) {
            throw new RuntimeException("Telegram foydalanuvchi ma'lumotlari o'qib bo'lmadi!");
        }

        User user = userRepository.findByTelegramId(tgUser.getId())
                .orElseGet(() -> {
                    String name = tgUser.getFirstName() + (tgUser.getLastName() != null ? " " + tgUser.getLastName() : "");
                    
                    User newUser = User.builder()
                            .name(name)
                            .email(null)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .role(Role.CLIENT)
                            .telegramId(tgUser.getId())
                            .build();
                    return userRepository.save(newUser);
                });

        String token = jwtUtils.generateToken("tg_" + user.getTelegramId());
        return buildAuthResponse(token, user);
    }

    public AuthResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi"));
        return buildAuthResponse(null, user);
    }

    public AuthResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi"));
        
        user.setName(request.getName());
        
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim();
            userRepository.findByEmail(newEmail).ifPresent(existing -> {
                if (!existing.getId().equals(userId)) {
                    throw new RuntimeException("Bu email allaqachon boshqa foydalanuvchi tomonidan ishlatilmoqda!");
                }
            });
            user.setEmail(newEmail);
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String cleanP = otpService.cleanPhone(request.getPhone());
            userRepository.findByPhone(cleanP).ifPresent(existing -> {
                if (!existing.getId().equals(userId)) {
                    throw new RuntimeException("Bu telefon raqami boshqa foydalanuvchi tomonidan ishlatilmoqda!");
                }
            });
            user.setPhone(cleanP);
        }
        
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        
        user = userRepository.save(user);
        return buildAuthResponse(null, user);
    }

    public void changePassword(Long userId, com.restoran.dto.request.PasswordChangeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi"));
        
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Eski parol noto'g'ri!");
        }
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
