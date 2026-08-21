package org.example.recrutment.controllers.notifications;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.dto.notifications.NotificationDto;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.services.notifications.NotificationService;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/notifications") @RequiredArgsConstructor
public class NotificationController {
  private final NotificationService service;
  @GetMapping public List<NotificationDto> getAll(@AuthenticationPrincipal Users user){ return service.getAllFor(user); }
  @GetMapping("/unread") public List<NotificationDto> getUnread(@AuthenticationPrincipal Users user){ return service.getUnreadFor(user); }
  @GetMapping("/unread/count") public UnreadCount getUnreadCount(@AuthenticationPrincipal Users user){ return new UnreadCount(service.getUnreadCountFor(user)); }
  @PatchMapping("/{id}/read") public NotificationDto markRead(@AuthenticationPrincipal Users user, @PathVariable Long id){ return service.markRead(user, id); }
  @PatchMapping("/read-all") @ResponseStatus(HttpStatus.NO_CONTENT) public void markAllRead(@AuthenticationPrincipal Users user){ service.markAllRead(user); }
  public record UnreadCount(long count) {}
}
