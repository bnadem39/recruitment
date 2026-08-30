package org.example.recrutment.controllers.candidatures;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.candidatures.ApplicationStatus;
import org.example.recrutment.entities.candidatures.FieldResponse;
import org.example.recrutment.entities.candidatures.FinalDecision;
import org.example.recrutment.entities.candidatures.RecruitmentStage;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.hr.EvaluatorAssignmentRepository;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.example.recrutment.repositories.candidatures.FieldResponseRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/evaluator/applications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EVALUATOR')")
public class EvaluatorApplicationController {
    private final EvaluatorAssignmentRepository assignments;
    private final ApplicationRepository applications;
    private final FieldResponseRepository responses;
    private final NotificationService notifications;

    @GetMapping
    @Transactional(readOnly = true)
    public List<ApplicationResponse> list(@AuthenticationPrincipal Users user) {
        Set<Long> offerIds = assignments.findByEvaluatorIdWithOffer(user.getId()).stream()
                .map(assignment -> assignment.getOffer().getId()).collect(java.util.stream.Collectors.toSet());
        if (offerIds.isEmpty()) return List.of();
        return applications.findByJobOffer_IdIn(List.copyOf(offerIds)).stream()
                .filter(application -> application.getStatus() != ApplicationStatus.DRAFT)
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse).toList();
    }

    @PostMapping("/{id}/decision")
    @Transactional
    public ApplicationResponse decide(@AuthenticationPrincipal Users user, @PathVariable Long id,
                                      @RequestBody DecisionRequest request) {
        Application application = assignedApplication(user, id);
        if (request.accepted()) {
            application.setStatus(ApplicationStatus.ACCEPTED);
            application.setFinalDecision(FinalDecision.ACCEPTED);
            application.setCurrentStage(RecruitmentStage.HR_INTERVIEW);
            notifications.notify(application.getCandidate(), "Application accepted",
                    "Your application for " + application.getJobOffer().getTitle() + " has been accepted. An interview may now be scheduled.",
                    "APPLICATION_ACCEPTED", "/applications/" + application.getId());
        } else {
            application.setStatus(ApplicationStatus.REJECTED);
            application.setFinalDecision(FinalDecision.REJECTED);
            application.setCurrentStage(RecruitmentStage.FINAL_DECISION);
            notifications.notify(application.getCandidate(), "Application update",
                    "Your application for " + application.getJobOffer().getTitle() + " was not selected.",
                    "APPLICATION_REJECTED", "/applications/" + application.getId());
        }
        return toResponse(applications.save(application));
    }

    private Application assignedApplication(Users user, Long id) {
        Application application = applications.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        boolean assigned = assignments.findByEvaluatorIdWithOffer(user.getId()).stream()
                .anyMatch(assignment -> assignment.getOffer().getId().equals(application.getJobOffer().getId()));
        if (!assigned) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to this job offer");
        return application;
    }

    private ApplicationResponse toResponse(Application application) {
        return new ApplicationResponse(application.getId(), application.getStatus(), application.getSubmittedAt(),
                application.getJobOffer().getId(), application.getJobOffer().getTitle(),
                application.getCandidate().getFirstName() + " " + application.getCandidate().getLastName(),
                application.getCandidate().getEmail(), responses.findByApplication_Id(application.getId()).stream()
                .map(this::toAnswer).toList());
    }

    private AnswerResponse toAnswer(FieldResponse response) {
        return new AnswerResponse(response.getField().getLabel(), response.getTextValue(), response.getNumberValue(),
                response.getDateValue(), response.getBooleanValue());
    }

    public record DecisionRequest(boolean accepted) {}
    public record ApplicationResponse(Long id, ApplicationStatus status, LocalDateTime submittedAt, Long jobOfferId,
                                      String jobOfferTitle, String candidateName, String candidateEmail,
                                      List<AnswerResponse> answers) {}
    public record AnswerResponse(String label, String textValue, BigDecimal numberValue,
                                 java.time.LocalDate dateValue, Boolean booleanValue) {}
}
