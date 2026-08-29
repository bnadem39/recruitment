package org.example.recrutment.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        passwordResetService.requestPasswordReset(request.email());

        /*
         * Always return the same message.
         * Do not reveal whether the email is registered.
         */
        return ResponseEntity.ok(
                new MessageResponse(
                        "If an account exists for this email address, a password reset link has been sent."
                )
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        passwordResetService.resetPassword(
                request.token(),
                request.newPassword(),
                request.passwordConfirmation()
        );

        return ResponseEntity.ok(
                new MessageResponse(
                        "Password updated successfully. You can now sign in."
                )
        );
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email format is invalid")
            String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Reset token is required")
            String token,

            @NotBlank(message = "New password is required")
            @Size(
                    min = 12,
                    message = "Your new password must contain at least 12 characters"
            )
            String newPassword,

            @NotBlank(message = "Password confirmation is required")
            String passwordConfirmation
    ) {
    }

    public record MessageResponse(String message) {
    }
}