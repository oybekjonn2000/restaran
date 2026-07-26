package com.restoran.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordOtpRequest {

    @NotBlank(message = "Telefon raqam bo'sh bo'lmasin")
    private String phone;

    @NotBlank(message = "OTP kod bo'sh bo'lmasin")
    private String code;

    @NotBlank(message = "Yangi parol bo'sh bo'lmasin")
    @Size(min = 8, message = "Parol kamida 8 ta belgi bo'lishi kerak")
    private String newPassword;
}
