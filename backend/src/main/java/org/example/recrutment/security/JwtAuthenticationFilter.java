package org.example.recrutment.security;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.users.UserStatus;
import org.example.recrutment.repositories.users.UserRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Component @RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService; private final UserRepository userRepository;
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }
        try {
            String email = jwtService.parse(header.substring(7)).getSubject();
            var user = userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (user == null) {
                unauthorized(response, "Authenticated user not found");
                return;
            }
            if (user.getStatus() != UserStatus.ACTIVE) {
                unauthorized(response, "Authenticated user is not active");
                return;
            }
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getUserRole().name()));
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, authorities));
            chain.doFilter(request, response);
        } catch (ExpiredJwtException ex) {
            SecurityContextHolder.clearContext();
            unauthorized(response, "Token expired");
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            unauthorized(response, "Invalid token");
        }
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        SecurityContextHolder.clearContext();
        response.setStatus(401);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
