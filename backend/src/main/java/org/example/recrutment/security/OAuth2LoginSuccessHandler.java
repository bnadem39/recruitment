package org.example.recrutment.security;

import jakarta.servlet.ServletException;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Locale;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtService jwt;

    @Value("${app.oauth2.frontend-redirect-uri}")
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String rawEmail = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");

        if (rawEmail == null) {
            response.sendRedirect(frontendRedirectUri + "?error=missing_email");
            return;
        }

        final String email = rawEmail.trim().toLowerCase(Locale.ROOT);

        Users user = users.findByEmailIgnoreCase(email).orElseGet(() -> {
            Candidates candidate = Candidates.builder()
                    .firstName(firstName != null ? firstName : "Google")
                    .lastName(lastName != null ? lastName : "User")
                    .email(email)
                    .password(passwords.encode(UUID.randomUUID().toString()))
                    .userRole(UserRole.CANDIDATE)
                    .status(UserStatus.ACTIVE)
                    .profileCompleted(false)
                    .build();
            return users.save(candidate);
        });

        if (user.getStatus() != UserStatus.ACTIVE) {
            response.sendRedirect(frontendRedirectUri + "?error=account_disabled");
            return;
        }

        String token = jwt.generateToken(user);

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .queryParam("token", token)
                .queryParam("userId", user.getId())
                .queryParam("email", user.getEmail())
                .queryParam("role", user.getUserRole())
                .queryParam("firstName", user.getFirstName())
                .queryParam("lastName", user.getLastName())
                .build().toUriString();

        response.sendRedirect(redirectUrl);
    }
}