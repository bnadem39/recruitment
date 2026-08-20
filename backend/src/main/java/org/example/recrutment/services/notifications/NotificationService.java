package org.example.recrutment.services.notifications;

import org.example.recrutment.dto.notifications.NotificationDto;
import org.example.recrutment.entities.users.Users;
import java.util.List;
public interface NotificationService {
    NotificationDto notify(Users recipient, String title, String message, String type, String actionUrl);
    List<NotificationDto> getAllFor(Users recipient);
    List<NotificationDto> getUnreadFor(Users recipient);
    long getUnreadCountFor(Users recipient);
    NotificationDto markRead(Users recipient, Long notificationId);
    void markAllRead(Users recipient);
}
