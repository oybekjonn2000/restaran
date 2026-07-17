package com.restoran.controller;

import com.restoran.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService settingService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPublicSettings() {
        return ResponseEntity.ok(Map.of(
            "min_order_amount", settingService.getMinOrderAmount(),
            "payment_methods", settingService.getPaymentMethods()
        ));
    }
}
