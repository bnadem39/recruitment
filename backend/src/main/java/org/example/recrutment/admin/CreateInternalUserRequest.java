package org.example.recrutment.admin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.example.recrutment.entities.users.UserRole;
public record CreateInternalUserRequest(@NotBlank @Size(max=100) String firstName, @NotBlank @Size(max=100) String lastName,
        @NotBlank @Email @Size(max=150) String email, @NotBlank @Size(min=12,max=100) String password,
        @NotBlank @Size(min=12,max=100) String passwordConfirmation, @NotNull UserRole role) {}
