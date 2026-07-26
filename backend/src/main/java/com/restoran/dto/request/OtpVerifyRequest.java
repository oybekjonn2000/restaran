package com.restoran.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerifyRequest {

    @NotBlank(message = "Telefon raqam bo'sh bo'lmasin")
    private String phone;

    @NotBlank(message = "OTP kod bo'sh bo'lmasin")
    private String code;

    @NotBlank(message = "Maqsad (purpose) kiritilishi shart")
    private String purpose;
}
