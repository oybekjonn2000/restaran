package com.restoran.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class SystemSetting {
    @Id
    @Column(name = "setting_key")
    private String settingKey;

    @Column(name = "setting_value", nullable = false)
    private String settingValue;
}
