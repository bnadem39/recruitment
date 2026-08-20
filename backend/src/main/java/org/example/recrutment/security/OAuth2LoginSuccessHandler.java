package org.example.recrutment.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.users.Candidates;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.UserStatus;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.users.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler, AuthenticationFailureHandler {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtService jwt;

    @Value("${app.oauth2.frontend-redirect-uri}")
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User googleUser = (OAuth2User) authentication.getPrincipal();
        String rawEmail = googleUser.getAttribute("email");

        if (rawEmail == null || rawEmail.isBlank()) {
            redirectWithError(response, "Google did not provide an email address");
            return;
        }

        Boolean emailVerified = googleUser.getAttribute("email_verified");
        if (emailVerified == null) {
            emailVerified = googleUser.getAttribute("verified_email");
        }
        if (Boolean.FALSE.equals(emailVerified)) {
            redirectWithError(response, "The Google email address is not verified");
            return;
        }

        String email = rawEmail.trim().toLowerCase(Locale.ROOT);
        Users user = users.findByEmailIgnoreCase(email).orElseGet(() -> createCandidate(googleUser, email));

        if (user.getStatus() != UserStatus.ACTIVE) {
            redirectWithError(response, "This account is not active");
            return;
        }

        String fragment = "oauth=google"
                + "&accessToken=" + encode(jwt.generateToken(user))
                + "&userId=" + user.getId()
                + "&email=" + encode(user.getEmail())
                + "&role=" + user.getUserRole().name()
                + "&firstName=" + encode(user.getFirstName())
                + "&lastName=" + encode(user.getLastName());
        response.sendRedirect(frontendUrl(fragment));
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        redirectWithError(response, "Google authentication failed");
    }

    private Candidates createCandidate(OAuth2User googleUser, String email) {
        String firstName = normalizedName(googleUser.getAttribute("given_name"), "Google");
        String lastName = normalizedName(googleUser.getAttribute("family_name"), "User");
        return users.save(Candidates.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .password(passwords.encode(UUID.randomUUID() + "-" + UUID.randomUUID()))
                .userRole(UserRole.CANDIDATE)
                .status(UserStatus.ACTIVE)
                .profileCompleted(false)
                .build());
    }

    private void redirectWithError(HttpServletResponse response, String message) throws IOException {
        response.sendRedirect(frontendUrl("oauth=google&error=" + encode(message)));
    }

    private String frontendUrl(String fragment) {
        return UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .fragment(fragment)
                .build(true)
                .toUriString();
    }

    private static String normalizedName(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
