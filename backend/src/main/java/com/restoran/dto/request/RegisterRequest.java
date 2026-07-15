package com.restoran.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Ism bo'sh bo'lmasin")
    private String name;

    // Email ixtiyoriy — kiritilmasligi mumkin
    @Email(message = "To'g'ri email kiriting")
    private String email;

    @NotBlank(message = "Parol bo'sh bo'lmasin")
    @Size(min = 6, message = "Parol kamida 6 ta belgi bo'lsin")
    private String password;

    private String phone;
    private String address;

    // CLIENT, COURIER, ADMIN, MANAGER
    private String role;

    private java.util.List<Long> restaurantIds;
}
