package org.example.recrutment.auth;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.users.Candidates;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.UserStatus;
import org.example.recrutment.repositories.users.UserRepository;
import org.example.recrutment.security.JwtService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtService jwt;
    private final EmailVerificationService emailVerificationService;

    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        var user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException(
                        "Invalid credentials"
                ));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!passwords.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        return new AuthResponse(
                jwt.generateToken(user),
                "Bearer",
                user.getId(),
                user.getEmail(),
                user.getUserRole(),
                user.getFirstName(),
                user.getLastName()
        );
    }

    @Transactional
    public SignupResponse signup(CandidateSignupRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (!request.password().equals(request.passwordConfirmation())) {
            throw new IllegalArgumentException(
                    "Password confirmation does not match"
            );
        }

        if (users.existsByEmailIgnoreCase(email)) {
            throw new DataIntegrityViolationException(
                    "An account already uses this email address"
            );
        }

        Candidates candidate = Candidates.builder()
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .email(email)
                .password(passwords.encode(request.password()))
                .phone(
                        request.phone() == null
                                ? null
                                : request.phone().trim()
                )
                .userRole(UserRole.CANDIDATE)
                .status(UserStatus.ACTIVE)
                .emailVerified(false)
                .profileCompleted(false)
                .build();

        var saved = users.save(candidate);

        emailVerificationService.sendVerificationEmail(saved);

        return new SignupResponse(
                "Account created. Please check your email to confirm your address before signing in.",
                saved.getEmail()
        );
    }

    public String verifyEmail(VerifyEmailRequest request) {
        return emailVerificationService.verify(
                request.email(),
                request.code()
        );
    }
}