package com.restoran.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Telefon raqam bo'sh bo'lmasin")
    private String phone;

    @NotBlank(message = "Parol bo'sh bo'lmasin")
    private String password;

    private String initData;

    // Eski email fieldni saqlaymiz (Telegram login uchun)
    private String email;

    private Boolean rememberMe = false;
}
