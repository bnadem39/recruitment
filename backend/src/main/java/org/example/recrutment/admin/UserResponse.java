package org.example.recrutment.admin;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.UserStatus;
import java.time.LocalDateTime;
public record UserResponse(Long id, String firstName, String lastName, String email, UserRole role, UserStatus status, LocalDateTime createdAt, LocalDateTime updatedAt) {}
