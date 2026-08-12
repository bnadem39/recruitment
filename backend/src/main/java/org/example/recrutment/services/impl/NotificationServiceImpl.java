package org.example.recrutment.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.notification.Notification;
import org.example.recrutment.repositories.NotificationRepository;
import org.example.recrutment.services.NotificationService;
import org.springframework.stereotype.Service;
import java.util.List;
@Service @RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
  private final NotificationRepository repo;
  public Notification create(Notification e){ return repo.save(e);} public Notification update(Long id, Notification e){var c=getById(id); c.setTitle(e.getTitle()); c.setMessage(e.getMessage()); c.setNotificationType(e.getNotificationType()); c.setChannel(e.getChannel()); c.setReadStatus(e.getReadStatus()); c.setSentAt(e.getSentAt()); return repo.save(c);} public Notification getById(Long id){ return repo.findById(id).orElseThrow(()->new org.example.recrutment.shared.exceptions.ResourceNotFoundException("Notification introuvable avec l'id "+id));} public List<Notification> getAll(){ return repo.findAll(); } public void delete(Long id){ repo.delete(getById(id)); }
}
