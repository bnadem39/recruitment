package org.example.recrutment.repositories;

import org.example.recrutment.entities.notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {}
