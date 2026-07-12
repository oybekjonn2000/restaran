package com.restoran.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Email bo'sh bo'lmasin")
    @Email(message = "To'g'ri email kiriting")
    private String email;

    @NotBlank(message = "Parol bo'sh bo'lmasin")
    private String password;

    private String initData;
}
