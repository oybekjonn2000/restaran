package com.restoran.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    private String name;
    private String surname;

    // Email ixtiyoriy — kiritilmasligi mumkin
    @Email(message = "To'g'ri email kiriting")
    private String email;

    @Size(min = 6, message = "Parol kamida 6 ta belgi bo'lsin")
    private String password;

    private String phone;
    private String otpCode;

    // Manzil ma'lumotlari
    private String address;
    private String house;
    private String entrance;
    private String floor;
    private String apartment;

    // CLIENT, COURIER, ADMIN, MANAGER
    private String role;

    private java.util.List<Long> restaurantIds;
}
