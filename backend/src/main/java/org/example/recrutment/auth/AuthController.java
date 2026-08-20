package org.example.recrutment.auth;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @PostMapping("/login") public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) { return ResponseEntity.ok(authService.login(request)); }
    @PostMapping("/signup") public ResponseEntity<SignupResponse> signup(@Valid @RequestBody CandidateSignupRequest request) {
        return ResponseEntity.status(201).body(authService.signup(request));
    }
    @PostMapping("/verify-email") public ResponseEntity<Map<String, String>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        String email = authService.verifyEmail(request);
        return ResponseEntity.ok(Map.of("message", "Email confirmed. You can now sign in.", "email", email));
    }
}
