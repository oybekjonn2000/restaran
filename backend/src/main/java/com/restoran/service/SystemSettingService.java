package com.restoran.service;

import com.restoran.entity.SystemSetting;
import com.restoran.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SystemSettingService {

    private final SystemSettingRepository repository;

    @PostConstruct
    public void init() {
        if (!repository.existsById("min_order_amount")) {
            repository.save(SystemSetting.builder()
                .settingKey("min_order_amount")
                .settingValue("40000")
                .build());
        }
        if (!repository.existsById("payment_methods")) {
            repository.save(SystemSetting.builder()
                .settingKey("payment_methods")
                .settingValue("CARD,CASH")
                .build());
        }
    }

    public double getMinOrderAmount() {
        return repository.findById("min_order_amount")
                .map(s -> {
                    try {
                        return Double.parseDouble(s.getSettingValue());
                    } catch (Exception e) {
                        return 40000.0;
                    }
                })
                .orElse(40000.0);
    }

    public List<String> getPaymentMethods() {
        String methods = repository.findById("payment_methods")
                .map(SystemSetting::getSettingValue)
                .orElse("CARD,CASH");
        return Arrays.asList(methods.split(","));
    }

    public void updateSetting(String key, String value) {
        repository.save(SystemSetting.builder()
            .settingKey(key)
            .settingValue(value)
            .build());
    }
}
