package com.restoran.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordChangeRequest {

    @NotBlank(message = "Eski parol bo'sh bo'lmasin")
    private String oldPassword;

    @NotBlank(message = "Yangi parol bo'sh bo'lmasin")
    private String newPassword;
}
