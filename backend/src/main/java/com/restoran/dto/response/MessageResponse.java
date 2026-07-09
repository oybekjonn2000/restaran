package com.restoran.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {
    private String message;
    private boolean success;

    public static MessageResponse ok(String message) {
        return MessageResponse.builder().message(message).success(true).build();
    }

    public static MessageResponse error(String message) {
        return MessageResponse.builder().message(message).success(false).build();
    }
}
