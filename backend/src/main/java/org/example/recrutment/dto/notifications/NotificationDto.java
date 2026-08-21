package org.example.recrutment.dto.notifications;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String title,
        String message,
        boolean read,
        LocalDateTime createdAt,
        String type,
        String actionUrl) {
}
