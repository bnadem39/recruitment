package org.example.recrutment.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.dto.notifications.NotificationDto;
import org.example.recrutment.entities.notification.Notification;
import org.example.recrutment.entities.notification.NotificationChannel;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.notifications.NotificationRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;
import java.util.List;
@Service @RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
  private final NotificationRepository repo;
  private final SimpMessagingTemplate messagingTemplate;

  @Override
  @Transactional
  public NotificationDto notify(Users recipient, String title, String message, String type, String actionUrl) {
      Notification saved = repo.saveAndFlush(Notification.builder()
              .recipient(recipient)
              .title(title)
              .message(message)
              .notificationType(type)
              .channel(NotificationChannel.IN_APP)
              .readStatus(false)
              .sentAt(LocalDateTime.now())
              .actionUrl(actionUrl)
              .build());
      NotificationDto dto = toDto(saved);
      Runnable publish = () -> messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/notifications", dto);
      if (TransactionSynchronizationManager.isSynchronizationActive()) {
          TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
              @Override public void afterCommit() { publish.run(); }
          });
      } else {
          publish.run();
      }
      return dto;
  }

  @Override
  @Transactional(readOnly = true)
  public List<NotificationDto> getAllFor(Users recipient) {
      return repo.findByRecipient_IdOrderByCreatedAtDesc(recipient.getId()).stream().map(this::toDto).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<NotificationDto> getUnreadFor(Users recipient) {
      return repo.findByRecipient_IdAndReadStatusFalseOrderByCreatedAtDesc(recipient.getId()).stream().map(this::toDto).toList();
  }

  @Override
  public long getUnreadCountFor(Users recipient) {
      return repo.countByRecipient_IdAndReadStatusFalse(recipient.getId());
  }

  @Override
  @Transactional
  public NotificationDto markRead(Users recipient, Long notificationId) {
      Notification notification = repo.findByIdAndRecipient_Id(notificationId, recipient.getId())
              .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
      notification.setReadStatus(true);
      return toDto(repo.save(notification));
  }

  @Override
  @Transactional
  public void markAllRead(Users recipient) {
      List<Notification> unread = repo.findByRecipient_IdAndReadStatusFalseOrderByCreatedAtDesc(recipient.getId());
      unread.forEach(notification -> notification.setReadStatus(true));
      repo.saveAll(unread);
  }

  private NotificationDto toDto(Notification notification) {
      return new NotificationDto(notification.getId(), notification.getTitle(), notification.getMessage(),
              notification.isReadStatus(), notification.getCreatedAt(),
              notification.getNotificationType(), notification.getActionUrl());
  }
}
