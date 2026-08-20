package org.example.recrutment.entities.notification;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.example.recrutment.entities.users.Users;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(columnDefinition = "TEXT")
    private String message;
    @Column(name = "notification_type")
    private String notificationType;
    @Enumerated(EnumType.STRING)
    private NotificationChannel channel;
    @Column(name = "read_status", nullable = false)
    @Builder.Default
    private Boolean readStatus = false;
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    @Column(name = "action_url")
    private String actionUrl;
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    private Users recipient;
}
