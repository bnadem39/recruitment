package org.example.recrutment.repositories.notifications;

import org.example.recrutment.entities.notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipient_IdOrderByCreatedAtDesc(Long recipientId);
    List<Notification> findByRecipient_IdAndReadStatusFalseOrderByCreatedAtDesc(Long recipientId);
    long countByRecipient_IdAndReadStatusFalse(Long recipientId);
    Optional<Notification> findByIdAndRecipient_Id(Long id, Long recipientId);
}
