package org.example.recrutment.admin;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.example.recrutment.auth.EmailVerificationService;
import org.example.recrutment.entities.users.*;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.hr.EvaluatorAssignmentRepository;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.example.recrutment.repositories.complaints.ComplaintRepository;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.example.recrutment.repositories.notifications.NotificationRepository;
import org.example.recrutment.repositories.users.EmailVerificationTokenRepository;
import org.example.recrutment.repositories.users.PasswordResetTokenRepository;
import org.example.recrutment.repositories.users.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
@Service @RequiredArgsConstructor @Transactional
public class AdminUserService {
    private final UserRepository users; private final PasswordEncoder passwords; private final EmailVerificationService emailVerificationService;
    private final EmailVerificationTokenRepository tokens;
    private final NotificationRepository notifications;
    private final PasswordResetTokenRepository passwordResetTokens;
    private final InterviewRepository interviews;
    private final ApplicationRepository applications;
    private final ComplaintRepository complaints;
    private final EvaluatorAssignmentRepository evaluatorAssignments;

    public UserResponse create(CreateInternalUserRequest r) {
        if (r.role() != UserRole.HR && r.role() != UserRole.EVALUATOR) throw new IllegalArgumentException("Only HR or EVALUATOR accounts may be created");
        String email = r.email().trim().toLowerCase(Locale.ROOT);
        if (!r.password().equals(r.passwordConfirmation())) throw new IllegalArgumentException("Password confirmation does not match");
        if (users.existsByEmailIgnoreCase(email)) throw new DataIntegrityViolationException("Email is already in use");
        var user = Users.builder().firstName(r.firstName().trim()).lastName(r.lastName().trim()).email(email)
                .password(passwords.encode(r.password())).userRole(r.role()).status(UserStatus.ACTIVE)
                .emailVerified(true).emailVerifiedAt(LocalDateTime.now()).build();
        var saved = users.save(user);
        return map(saved);
    }
    @Transactional(readOnly=true)
    public List<UserResponse> list(UserRole role, UserStatus status, String email, String name) {
        return users.findAll((root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(root.get("userRole").in(UserRole.HR, UserRole.EVALUATOR));
            if (role != null) p.add(cb.equal(root.get("userRole"), role));
            if (status != null) p.add(cb.equal(root.get("status"), status));
            if (email != null && !email.isBlank()) p.add(cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase(Locale.ROOT) + "%"));
            if (name != null && !name.isBlank()) { String n = "%" + name.toLowerCase(Locale.ROOT) + "%"; p.add(cb.or(cb.like(cb.lower(root.get("firstName")), n), cb.like(cb.lower(root.get("lastName")), n))); }
            return cb.and(p.toArray(Predicate[]::new));
        }).stream().map(this::map).toList();
    }
    public UserResponse status(Long id, UserStatus status, Users admin) {
        var user = internal(id);
        if (Objects.equals(user.getId(), admin.getId())) throw new AccessDeniedException("You cannot change your own access");
        user.setStatus(status);
        if (status == UserStatus.ACTIVE && !Boolean.TRUE.equals(user.getEmailVerified())) {
            user.setEmailVerified(true);
            user.setEmailVerifiedAt(java.time.LocalDateTime.now());
        }
        return map(users.save(user));
    }
    public void delete(Long id, Users admin) {
        var user = internal(id);
        if (Objects.equals(user.getId(), admin.getId()))
            throw new AccessDeniedException("You cannot delete your own account");

        tokens.deleteByUser_Id(user.getId());
        notifications.deleteByRecipient_Id(user.getId());
        passwordResetTokens.deleteByUser_Id(user.getId());
        evaluatorAssignments.deleteByEvaluator_Id(user.getId());
        interviews.unassignEvaluator(user.getId());
        applications.unassignFormEvaluator(user.getId());
        complaints.clearRespondedBy(user.getId());
        complaints.clearComplaintUser(user.getId());

        users.delete(user);
    }
    private Users internal(Long id) { var u = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found")); if (u.getUserRole()!=UserRole.HR && u.getUserRole()!=UserRole.EVALUATOR) throw new AccessDeniedException("Only internal staff accounts can be managed"); return u; }
    private UserResponse map(Users u) { return new UserResponse(u.getId(),u.getFirstName(),u.getLastName(),u.getEmail(),u.getUserRole(),u.getStatus(),u.getCreatedAt(),u.getUpdatedAt()); }
}
