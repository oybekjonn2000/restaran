package com.restoran.service;

import com.restoran.dto.request.LoginRequest;
import com.restoran.dto.request.RegisterRequest;
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

    public AuthResponse login(LoginRequest request) {
        // Phone raqami bilan kirish (email fallback saqlanadi)
        String identifier = (request.getPhone() != null && !request.getPhone().isBlank())
            ? request.getPhone().trim()
            : request.getEmail();

        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        boolean rememberMe = request.getRememberMe() != null && request.getRememberMe();
        String token = jwtUtils.generateToken(userDetails.getUsername(), rememberMe);

        // Phone yoki email bo'yicha foydalanuvchini topamiz
        User user = userRepository.findByPhone(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi"));

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
        // Email ixtiyoriy: kiritilgan bo'lsa tekshiramiz, yo'q bo'lsa placeholder yaratamiz
        String email = (request.getEmail() != null && !request.getEmail().isBlank())
            ? request.getEmail().trim()
            : null;

        if (email != null && userRepository.existsByEmail(email)) {
            throw new RuntimeException("Bu email allaqachon ro'yxatdan o'tgan!");
        }

        // JWT uchun unikal identifier: email bo'lsa email, bo'lmasa UUID
        String jwtSubject = (email != null) ? email : ("user_" + java.util.UUID.randomUUID() + "@noemail.local");

        Role role = Role.CLIENT;

        User user = User.builder()
            .name(request.getName())
            .email(jwtSubject)  // email yo'q bo'lsa ham placeholder saqlaymiz (login uchun kerak)
            .password(passwordEncoder.encode(request.getPassword()))
            .phone(request.getPhone())
            .address(request.getAddress())
            .role(role)
            .build();

        user = userRepository.save(user);
        String token = jwtUtils.generateToken(user.getEmail());

        return buildAuthResponse(token, user);
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        // Placeholder email (@noemail.local) frontendga yuborilmasin
        String displayEmail = (user.getEmail() != null && user.getEmail().endsWith("@noemail.local"))
            ? null
            : user.getEmail();
        return AuthResponse.builder()
            .token(token)
            .type("Bearer")
            .id(user.getId())
            .name(user.getName())
            .email(displayEmail)
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
                    String email = "telegram_" + tgUser.getId() + "@restoran.com";
                    String name = tgUser.getFirstName() + (tgUser.getLastName() != null ? " " + tgUser.getLastName() : "");
                    
                    User newUser = User.builder()
                            .name(name)
                            .email(email)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .role(Role.CLIENT)
                            .telegramId(tgUser.getId())
                            .build();
                    return userRepository.save(newUser);
                });

        String token = jwtUtils.generateToken(user.getEmail());
        return buildAuthResponse(token, user);
    }

    public AuthResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi"));
        return buildAuthResponse(null, user);
    }

    public AuthResponse updateProfile(Long userId, com.restoran.dto.request.ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Foydalanuvchi topilmadi"));
        
        user.setName(request.getName());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
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
