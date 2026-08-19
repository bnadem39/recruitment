package org.example.recrutment.controllers.notifications;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.notification.Notification;
import org.example.recrutment.services.notifications.NotificationService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/notifications") @RequiredArgsConstructor
public class NotificationController {
  private final NotificationService service;
  @PostMapping public ResponseEntity<Notification> create(@RequestBody Notification e){ return new ResponseEntity<>(service.create(e), HttpStatus.CREATED);}
  @GetMapping public ResponseEntity<List<Notification>> getAll(){ return ResponseEntity.ok(service.getAll());}
  @GetMapping("/{id}") public ResponseEntity<Notification> getById(@PathVariable Long id){ return ResponseEntity.ok(service.getById(id));}
  @PutMapping("/{id}") public ResponseEntity<Notification> update(@PathVariable Long id,@RequestBody Notification e){ return ResponseEntity.ok(service.update(id,e));}
  @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){ service.delete(id); return ResponseEntity.noContent().build();}
}
