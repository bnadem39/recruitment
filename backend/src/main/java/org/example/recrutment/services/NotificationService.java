package org.example.recrutment.services;

import org.example.recrutment.entities.notification.Notification;
import java.util.List;
public interface NotificationService { Notification create(Notification e); Notification update(Long id, Notification e); Notification getById(Long id); List<Notification> getAll(); void delete(Long id); }
