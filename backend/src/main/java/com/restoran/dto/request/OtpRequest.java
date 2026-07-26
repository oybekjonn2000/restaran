package com.restoran.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpRequest {

    @NotBlank(message = "Telefon raqam bo'sh bo'lmasin")
    private String phone;

    // REGISTER yoki RESET_PASSWORD
    @NotBlank(message = "Maqsad (purpose) kiritilishi shart")
    private String purpose;

    // Telegram Mini App uchun ixtiyoriy Telegram User ID
    private Long telegramId;
}
