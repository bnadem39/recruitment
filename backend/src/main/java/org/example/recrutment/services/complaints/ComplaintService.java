package org.example.recrutment.services.complaints;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.dto.complaints.*;
import org.example.recrutment.entities.complaints.Complaint;
import org.example.recrutment.entities.complaints.ComplaintCategory;
import org.example.recrutment.entities.complaints.ComplaintStatus;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.complaints.ComplaintRepository;
import org.example.recrutment.repositories.users.UserRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ComplaintService {
    private final ComplaintRepository repository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ComplaintResponse createComplaint(Users user, CreateComplaintRequest request) {
        Complaint complaint = repository.save(Complaint.builder()
                .user(user).subject(request.subject().trim()).message(request.message().trim())
                .category(request.category()).status(ComplaintStatus.PENDING).build());
        userRepository.findByUserRoleOrderByFirstNameAscLastNameAsc(UserRole.ADMIN)
                .forEach(admin -> notificationService.notify(admin, "New complaint",
                        "New complaint submitted by " + user.getFirstName() + " " + user.getLastName(),
                        "COMPLAINT_CREATED", "/complaints/" + complaint.getId()));
        return toUserResponse(complaint);
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> getMyComplaints(Users user) {
        return repository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(this::toUserResponse).toList();
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getMyComplaintById(Users user, Long id) {
        return toUserResponse(repository.findByIdAndUserId(id, user.getId()).orElseThrow(() -> notFound(id)));
    }

    @Transactional(readOnly = true)
    public List<AdminComplaintResponse> getAllComplaints(ComplaintStatus status, ComplaintCategory category, UserRole role) {
        List<Complaint> complaints = status != null ? repository.findByStatusOrderByCreatedAtDesc(status)
                : category != null ? repository.findByCategoryOrderByCreatedAtDesc(category)
                : role != null ? repository.findByUser_UserRoleOrderByCreatedAtDesc(role)
                : repository.findAllByOrderByCreatedAtDesc();
        return complaints.stream().map(this::toAdminResponse).toList();
    }

    @Transactional(readOnly = true)
    public AdminComplaintResponse getComplaintById(Long id) {
        return toAdminResponse(repository.findById(id).orElseThrow(() -> notFound(id)));
    }

    @Transactional
    public AdminComplaintResponse respondToComplaint(Long id, Users admin, ComplaintResponseRequest request) {
        Complaint complaint = repository.findById(id).orElseThrow(() -> notFound(id));
        complaint.setResponse(request.response().trim());
        complaint.setRespondedAt(LocalDateTime.now());
        complaint.setRespondedBy(admin);
        complaint.setStatus(ComplaintStatus.RESOLVED);
        Complaint saved = repository.save(complaint);
        notificationService.notify(saved.getUser(), "Complaint response",
                "Your complaint has received a response from the administration.",
                "COMPLAINT_RESPONSE", "/complaints/" + id);
        return toAdminResponse(saved);
    }

    @Transactional
    public AdminComplaintResponse updateStatus(Long id, ComplaintStatus status) {
        Complaint complaint = repository.findById(id).orElseThrow(() -> notFound(id));
        complaint.setStatus(status);
        return toAdminResponse(repository.save(complaint));
    }

    private ResponseStatusException notFound(Long id) { return new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found: " + id); }
    private ComplaintResponse toUserResponse(Complaint c) { return new ComplaintResponse(c.getId(), c.getSubject(), c.getMessage(), c.getCategory(), c.getStatus(), c.getCreatedAt(), c.getUpdatedAt(), c.getResponse(), c.getRespondedAt()); }
    private AdminComplaintResponse toAdminResponse(Complaint c) {
        Users user = c.getUser();
        Users responder = c.getRespondedBy();
        return new AdminComplaintResponse(c.getId(), c.getSubject(), c.getMessage(), c.getCategory(), c.getStatus(), c.getCreatedAt(), c.getUpdatedAt(), c.getResponse(), c.getRespondedAt(), user.getId(), user.getFirstName() + " " + user.getLastName(), user.getEmail(), user.getUserRole().name(), responder == null ? null : responder.getId(), responder == null ? null : responder.getFirstName() + " " + responder.getLastName());
    }
}
