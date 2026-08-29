package org.example.recrutment.auth;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.users.PasswordResetToken;
import org.example.recrutment.repositories.users.PasswordResetTokenRepository;
import org.example.recrutment.repositories.users.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.password-reset.from}")
    private String fromEmail;

    @Value("${app.password-reset.frontend-url}")
    private String frontendUrl;

    @Value("${app.password-reset.expiration-minutes:30}")
    private long expirationMinutes;

    @Transactional
    public void requestPasswordReset(String email) {
        var userOptional = userRepository.findByEmailIgnoreCase(email);

        /*
         * Security:
         * do nothing if the user does not exist.
         * Controller always returns the same generic message.
         */
        if (userOptional.isEmpty()) {
            return;
        }

        var user = userOptional.get();

        /*
         * A user should have one valid reset token at a time.
         */
        passwordResetTokenRepository.deleteByUser_Id(user.getId());

        String rawToken = generateSecureToken();

        PasswordResetToken passwordResetToken =
                PasswordResetToken.builder()
                        .tokenHash(sha256(rawToken))
                        .user(user)
                        .expiresAt(
                                LocalDateTime.now().plusMinutes(expirationMinutes)
                        )
                        .build();

        passwordResetTokenRepository.save(passwordResetToken);

        String resetLink = frontendUrl
                + "/reset-password?token="
                + rawToken;

        sendPasswordResetEmail(
                user.getEmail(),
                user.getFirstName(),
                resetLink
        );
    }

    @Transactional
    public void resetPassword(
            String rawToken,
            String newPassword,
            String passwordConfirmation
    ) {
        if (!newPassword.equals(passwordConfirmation)) {
            throw new IllegalArgumentException(
                    "Password confirmation does not match."
            );
        }

        if (newPassword.length() < 12) {
            throw new IllegalArgumentException(
                    "Your new password must contain at least 12 characters."
            );
        }

        String tokenHash = sha256(rawToken);

        PasswordResetToken resetToken =
                passwordResetTokenRepository
                        .findByTokenHashAndUsedAtIsNull(tokenHash)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "This password reset link is invalid or has already been used."
                        ));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);

            throw new IllegalArgumentException(
                    "This password reset link has expired. Please request a new one."
            );
        }

        var user = resetToken.getUser();

        user.setPassword(passwordEncoder.encode(newPassword));

        /*
         * Mark as used before deletion, then remove it.
         * Removing makes the token unusable forever.
         */
        resetToken.setUsedAt(LocalDateTime.now());

        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];

        new SecureRandom().nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            byte[] hash = MessageDigest
                    .getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));

            StringBuilder output = new StringBuilder();

            for (byte item : hash) {
                output.append(String.format("%02x", item));
            }

            return output.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 algorithm is unavailable.",
                    exception
            );
        }
    }

    private void sendPasswordResetEmail(
            String recipientEmail,
            String firstName,
            String resetLink
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("Reset your BFPME Recruit password");

            String name =
                    firstName == null || firstName.isBlank()
                            ? "there"
                            : firstName;

            String html = """
                <!doctype html>
                <html>
                  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#17243e;">
                    <div style="max-width:600px;margin:30px auto;padding:32px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;">
                      <h1 style="margin:0 0 20px;color:#17243e;font-size:24px;">
                        BFPME <span style="color:#128c78;">Recruit</span>
                      </h1>

                      <h2 style="margin:0 0 16px;font-size:22px;">
                        Reset your password
                      </h2>

                      <p style="line-height:1.6;">
                        Hello %s,
                      </p>

                      <p style="line-height:1.6;">
                        We received a request to reset your password.
                      </p>

                      <p style="margin:28px 0;">
                        <a href="%s"
                           style="display:inline-block;padding:12px 18px;border-radius:8px;background:#128c78;color:#ffffff;text-decoration:none;font-weight:bold;">
                          Reset password
                        </a>
                      </p>

                      <p style="color:#64748b;font-size:13px;line-height:1.6;">
                        This link expires in %d minutes and can only be used once.
                      </p>

                      <p style="color:#64748b;font-size:13px;line-height:1.6;">
                        If you did not request this reset, you can safely ignore this email.
                      </p>
                    </div>
                  </body>
                </html>
                """.formatted(
                    escapeHtml(name),
                    resetLink,
                    expirationMinutes
            );

            helper.setText(html, true);

            mailSender.send(message);
        } catch (MessagingException exception) {
            throw new IllegalStateException(
                    "Could not send password reset email.",
                    exception
            );
        }
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }
}