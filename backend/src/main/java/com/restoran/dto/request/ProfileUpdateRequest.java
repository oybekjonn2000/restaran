package com.restoran.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateRequest {

    @NotBlank(message = "Ism bo'sh bo'lmasin")
    private String name;

    @Email(message = "To'g'ri email kiriting")
    private String email;

    private String phone;
    private String address;
}
