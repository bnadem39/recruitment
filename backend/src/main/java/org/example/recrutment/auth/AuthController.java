package org.example.recrutment.auth;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @PostMapping("/login") public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) { return ResponseEntity.ok(authService.login(request)); }
    @PostMapping("/signup") public ResponseEntity<AuthResponse> signup(@Valid @RequestBody CandidateSignupRequest request) {
        return ResponseEntity.status(201).body(authService.signup(request));
    }
}
