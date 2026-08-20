package org.example.recrutment.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CandidateSignupRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 12, max = 100) String password,
        @NotBlank @Size(min = 12, max = 100) String passwordConfirmation,
        @Size(max = 20) String phone
) {}
