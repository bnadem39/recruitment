package org.example.recrutment.admin;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.users.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/admin/users") @RequiredArgsConstructor @PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    private final AdminUserService service;
    @PostMapping public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateInternalUserRequest request) { return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request)); }
    @GetMapping public List<UserResponse> list(@RequestParam(required=false) UserRole role, @RequestParam(required=false) UserStatus status, @RequestParam(required=false) String email, @RequestParam(required=false) String name) { return service.list(role,status,email,name); }
    @PatchMapping("/{id}/disable") public UserResponse disable(@PathVariable Long id, @AuthenticationPrincipal Users admin) { return service.status(id,UserStatus.DISABLED,admin); }
    @PatchMapping("/{id}/activate") public UserResponse activate(@PathVariable Long id, @AuthenticationPrincipal Users admin) { return service.status(id,UserStatus.ACTIVE,admin); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id, @AuthenticationPrincipal Users admin) { service.delete(id,admin); }
}
