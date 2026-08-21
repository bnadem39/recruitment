package org.example.recrutment.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.recrutment.entities.users.EmailVerificationToken;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.users.EmailVerificationTokenRepository;
import org.example.recrutment.repositories.users.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {
    private final EmailVerificationTokenRepository tokens;
    private final UserRepository users;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.email-verification.expiration-minutes}")
    private long expirationMinutes;

    @Value("${app.email-verification.from}")
    private String from;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Transactional
    public void sendVerificationEmail(Users user) {
        if (mailUsername == null || mailUsername.isBlank()) {
            throw new EmailDeliveryException("Email verification is not configured. Please configure Gmail SMTP before signing up.");
        }
        validateMailConfiguration();

        expirePreviousCodes(user.getEmail());
        String code = randomCode();
        tokens.save(EmailVerificationToken.builder()
                .codeHash(hash(code))
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(expirationMinutes))
                .build());

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(user.getEmail());
        message.setSubject("Verify your BFPME Recruit email");
        message.setText("Hello " + user.getFirstName() + ",\n\n"
                + "Your verification code is: " + code + "\n\n"
                + "This code expires in " + expirationMinutes + " minutes.");
        try {
            log.info("Sending email verification code from {} to {}", maskEmail(from), maskEmail(user.getEmail()));
            mailSender.send(message);
        } catch (MailException exception) {
            log.warn("Email verification delivery failed from {} to {}: {}", maskEmail(from), maskEmail(user.getEmail()), exception.getClass().getSimpleName());
            throw new EmailDeliveryException("Email verification could not be sent. Please check Gmail SMTP configuration.", exception);
        }
    }

    @Transactional
    public String verify(String email, String code) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        EmailVerificationToken verification = tokens.findTopByUser_EmailIgnoreCaseAndCodeHashAndUsedAtIsNullOrderByCreatedAtDesc(normalizedEmail, hash(code.trim()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid email verification code"));
        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Email verification code has expired");
        }
        Users user = verification.getUser();
        if (!user.getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Invalid email verification code");
        }
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        verification.setUsedAt(LocalDateTime.now());
        users.save(user);
        tokens.save(verification);
        return user.getEmail();
    }

    private void expirePreviousCodes(String email) {
        LocalDateTime now = LocalDateTime.now();
        tokens.findByUser_EmailIgnoreCaseAndUsedAtIsNull(email).forEach(token -> token.setUsedAt(now));
    }

    private String randomCode() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private void validateMailConfiguration() {
        if (mailPassword == null || mailPassword.isBlank()) {
            throw new EmailDeliveryException("Email verification is not configured. Please configure MAIL_PASSWORD.");
        }
        String compactPassword = mailPassword.replaceAll("\\s+", "");
        if (mailHost != null && mailHost.equalsIgnoreCase("smtp.gmail.com") && compactPassword.length() != 16) {
            throw new EmailDeliveryException("Gmail SMTP app password must contain 16 characters without spaces.");
        }
    }

    private static String maskEmail(String email) {
        if (email == null || email.isBlank()) return "";
        int at = email.indexOf('@');
        if (at <= 1) return "***" + (at >= 0 ? email.substring(at) : "");
        return email.charAt(0) + "***" + email.substring(at);
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(digest.length * 2);
            for (byte value : digest) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
