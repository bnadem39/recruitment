package org.example.recrutment.controllers.candidatures;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.candidatures.ApplicationStatus;
import org.example.recrutment.entities.candidatures.FieldResponse;
import org.example.recrutment.entities.candidatures.FinalDecision;
import org.example.recrutment.entities.candidatures.RecruitmentStage;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.gestionEntretiens.InterviewMode;
import org.example.recrutment.entities.gestionEntretiens.InterviewType;
import org.example.recrutment.dto.gestionEntretiens.InterviewRequestDTO;
import org.example.recrutment.dto.gestionEntretiens.InterviewResponseDTO;
import org.example.recrutment.hr.EvaluatorAssignmentRepository;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.example.recrutment.repositories.candidatures.FieldResponseRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.example.recrutment.services.gestionEntretiens.InterviewService;
import org.example.recrutment.repositories.users.UserRepository;
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
    private final UserRepository users;
    private final InterviewService interviews;

    @GetMapping
    @Transactional(readOnly = true)
    public List<ApplicationResponse> list(@AuthenticationPrincipal Users user) {
        Set<Long> offerIds = assignments.findByEvaluatorIdWithOffer(user.getId()).stream()
                .map(assignment -> assignment.getOffer().getId()).collect(java.util.stream.Collectors.toSet());
        if (offerIds.isEmpty()) return List.of();
        return applications.findByJobOffer_IdIn(List.copyOf(offerIds)).stream()
                .filter(application -> application.getStatus() == ApplicationStatus.PENDING_EVALUATION
                        || application.getFormEvaluatedAt() != null)
                .sorted(Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse).toList();
    }

    @PostMapping("/{id}/evaluation")
    @Transactional
    public ApplicationResponse evaluate(@AuthenticationPrincipal Users user, @PathVariable Long id,
                                        @RequestBody FormEvaluationRequest request) {
        Application application = assignedApplication(user, id);
        if (request.score() == null || request.score() < 0 || request.score() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Score must be between 0 and 100");
        }
        if (request.decision() == null || request.decision() == FinalDecision.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose accept or reject");
        }
        application.setFormScore(request.score());
        application.setFormHrComment(blankToNull(request.commentForHR()));
        application.setFormCandidateComment(blankToNull(request.commentForCandidate()));
        application.setFormDecision(request.decision());
        application.setFormEvaluator(user);
        application.setFormEvaluatedAt(LocalDateTime.now());
        if (request.decision() == FinalDecision.ACCEPTED) {
            application.setStatus(ApplicationStatus.ACCEPTED);
            application.setFinalDecision(FinalDecision.ACCEPTED);
            application.setCurrentStage(RecruitmentStage.HR_INTERVIEW);
            notifications.notify(application.getCandidate(), "Application accepted",
                    "Your application for " + application.getJobOffer().getTitle() + " has been accepted. An interview will be scheduled.",
                    "APPLICATION_ACCEPTED", "/candidate/applications/" + application.getId());
        } else {
            application.setStatus(ApplicationStatus.REJECTED);
            application.setFinalDecision(FinalDecision.REJECTED);
            application.setCurrentStage(RecruitmentStage.FINAL_DECISION);
            notifications.notify(application.getCandidate(), "Application update",
                    "Your application for " + application.getJobOffer().getTitle() + " has not been selected for the next stage.",
                    "APPLICATION_REJECTED", "/candidate/applications/" + application.getId());
        }
        Application saved = applications.save(application);
        users.findByUserRoleOrderByFirstNameAscLastNameAsc(UserRole.HR).forEach(hr -> notifications.notify(hr,
                "Candidate evaluated", saved.getCandidate().getFirstName() + " " + saved.getCandidate().getLastName()
                        + " has been evaluated for " + saved.getJobOffer().getTitle() + ". Score: " + saved.getFormScore() + ".",
                "FORM_EVALUATED", "/hr/reviews/applications"));
        return toResponse(saved);
    }

    @PostMapping("/{id}/interview")
    @Transactional
    public InterviewResponseDTO scheduleInterview(@AuthenticationPrincipal Users user, @PathVariable Long id,
                                                  @RequestBody ScheduleInterviewRequest request) {
        Application application = assignedApplication(user, id);
        if (application.getStatus() != ApplicationStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only accepted applications can be scheduled");
        }
        if (request.scheduledAt() == null || request.durationMinutes() == null || request.durationMinutes() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A date, time and positive duration are required");
        }
        InterviewRequestDTO interview = InterviewRequestDTO.builder()
                .applicationId(application.getId()).assignedEvaluatorId(user.getId())
                .interviewType(request.interviewType() == null ? InterviewType.HR : request.interviewType())
                .scheduledAt(request.scheduledAt()).durationMinutes(request.durationMinutes())
                .mode(request.mode() == null ? InterviewMode.ONLINE : request.mode())
                .location(request.location()).meetingLink(request.meetingLink()).notes(request.notes()).build();
        return interviews.scheduleForAssignedEvaluator(interview, user);
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
                application.getCandidate().getEmail(), application.getFormScore(), application.getFormHrComment(),
                application.getFormCandidateComment(), application.getFormDecision(), application.getFormEvaluatedAt(),
                responses.findByApplication_Id(application.getId()).stream()
                .map(this::toAnswer).toList());
    }

    private AnswerResponse toAnswer(FieldResponse response) {
        return new AnswerResponse(response.getField().getLabel(), response.getTextValue(), response.getNumberValue(),
                response.getDateValue(), response.getBooleanValue());
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    public record FormEvaluationRequest(Integer score, String commentForHR, String commentForCandidate, FinalDecision decision) {}
    public record ScheduleInterviewRequest(java.time.LocalDateTime scheduledAt, Integer durationMinutes,
                                           InterviewType interviewType, InterviewMode mode, String location,
                                           String meetingLink, String notes) {}
    public record ApplicationResponse(Long id, ApplicationStatus status, LocalDateTime submittedAt, Long jobOfferId,
                                      String jobOfferTitle, String candidateName, String candidateEmail,
                                      Integer formScore, String formHrComment, String formCandidateComment,
                                      FinalDecision formDecision, LocalDateTime formEvaluatedAt,
                                      List<AnswerResponse> answers) {}
    public record AnswerResponse(String label, String textValue, BigDecimal numberValue,
                                 java.time.LocalDate dateValue, Boolean booleanValue) {}
}
