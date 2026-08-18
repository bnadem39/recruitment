package org.example.recrutment.auth;
import org.example.recrutment.entities.users.UserRole;
public record AuthResponse(String accessToken, String tokenType, Long userId, String email, UserRole role, String firstName, String lastName) {}
