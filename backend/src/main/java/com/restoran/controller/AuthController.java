package com.restoran.controller;

import com.restoran.dto.request.LoginRequest;
import com.restoran.dto.request.OtpRequest;
import com.restoran.dto.request.OtpVerifyRequest;
import com.restoran.dto.request.RegisterRequest;
import com.restoran.dto.request.ResetPasswordOtpRequest;
import com.restoran.dto.request.TelegramAuthRequest;
import com.restoran.dto.response.AuthResponse;
import com.restoran.security.UserDetailsImpl;
import com.restoran.service.AuthService;
import com.restoran.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@Valid @RequestBody OtpRequest request) {
        return ResponseEntity.ok(otpService.sendOtp(request.getPhone(), request.getPurpose(), request.getTelegramId()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return ResponseEntity.ok(otpService.verifyOtp(request.getPhone(), request.getCode(), request.getPurpose()));
    }

    @PostMapping("/reset-password-otp")
    public ResponseEntity<Map<String, Object>> resetPasswordOtp(@Valid @RequestBody ResetPasswordOtpRequest request) {
        authService.resetPasswordWithOtp(request);
        return ResponseEntity.ok(Map.of("message", "Parol muvaffaqiyatli o'zgartirildi"));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/telegram")
    public ResponseEntity<AuthResponse> loginWithTelegram(@Valid @RequestBody TelegramAuthRequest request) {
        return ResponseEntity.ok(authService.loginWithTelegram(request.getInitData()));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMe(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.getMe(userDetails.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody com.restoran.dto.request.ProfileUpdateRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.updateProfile(userDetails.getId(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody com.restoran.dto.request.PasswordChangeRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        authService.changePassword(userDetails.getId(), request);
        return ResponseEntity.ok().build();
    }
}
