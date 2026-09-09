package org.example.recrutment.controllers.hr;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.candidatures.ApplicationStatus;
import org.example.recrutment.entities.candidatures.FinalDecision;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.gestionEntretiens.InterviewEvaluation;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * REST Controller for HR to review candidate evaluations by Job Offer
 * and make final ACCEPT/REJECT decisions.
 *
 * IMPORTANT: This controller allows HR to see all evaluations (Form + Interview)
 * for a specific job offer and make the final hiring decision.
 * 
 * Security notes:
 * - Only HR and ADMIN can access
 * - Final decision can only be made by authenticated HR/ADMIN user
 * - Permission checks verify the application belongs to the requested job offer
 */
@RestController
@RequestMapping("/api/hr/job-offers/{jobOfferId}/evaluations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
@Transactional
public class HrJobOfferEvaluationsController {

    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final NotificationService notificationService;

    /**
     * Get all applications for a job offer with their evaluations.
     * 
     * Returns candidates with both form and interview evaluations,
     * allowing HR to make final decisions.
     *
     * @param jobOfferId The job offer ID
     * @return List of applications with evaluation details
     */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<JobOfferEvaluationResponse>> getJobOfferEvaluations(
            @PathVariable Long jobOfferId) {

        // Get all applications for this job offer
        List<Application> applications = applicationRepository.findByJobOffer_Id(jobOfferId);

        // Filter to only applications that have been evaluated (form evaluation done)
        List<JobOfferEvaluationResponse> responses = applications.stream()
                .filter(app -> app.getFormEvaluatedAt() != null)  // Only evaluated applications
                .map(app -> toEvaluationResponse(app, jobOfferId))
                .sorted(Comparator.comparing(JobOfferEvaluationResponse::candidateName))
                .toList();

        return ResponseEntity.ok(responses);
    }

    /**
     * Get detailed evaluation information for a specific application.
     * 
     * Includes form evaluation, interview evaluations, and current final decision.
     *
     * @param jobOfferId The job offer ID
     * @param applicationId The application ID
     * @return Detailed evaluation information
     * @throws 404 If application not found
     * @throws 403 If application doesn't belong to the job offer
     */
    @GetMapping("/{applicationId}")
    @Transactional(readOnly = true)
    public ResponseEntity<DetailedEvaluationResponse> getApplicationEvaluation(
            @PathVariable Long jobOfferId,
            @PathVariable Long applicationId) {

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

        // Verify application belongs to this job offer
        if (!application.getJobOffer().getId().equals(jobOfferId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Application does not belong to this job offer");
        }

        return ResponseEntity.ok(toDetailedResponse(application));
    }

    /**
     * Make the final HR decision on a candidate (ACCEPT or REJECT).
     * 
     * IMPORTANT:
     * - This is distinct from evaluator decisions (form/interview)
     * - Only HR/ADMIN can make this decision
     * - Must be based on all available evaluations
     * - Candidate is notified immediately
     *
     * @param jobOfferId The job offer ID
     * @param applicationId The application ID
     * @param user The authenticated HR/ADMIN user
     * @param request The decision (ACCEPTED or REJECTED)
     * @return Updated application with final decision
     * @throws 404 If application not found
     * @throws 403 If application doesn't belong to job offer
     * @throws 409 If already has a final decision (other than PENDING)
     */
    @PatchMapping("/{applicationId}/final-decision")
    public ResponseEntity<JobOfferEvaluationResponse> makeFinalDecision(
            @PathVariable Long jobOfferId,
            @PathVariable Long applicationId,
            @AuthenticationPrincipal Users user,
            @RequestBody FinalDecisionRequest request) {

        // Validate decision value
        if (request.decision() == null || request.decision() == FinalDecision.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Decision must be ACCEPTED or REJECTED");
        }

        // Get and verify application
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

        if (!application.getJobOffer().getId().equals(jobOfferId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Application does not belong to this job offer");
        }

        // Check if final decision already made
        if (application.getFinalDecision() != null && application.getFinalDecision() != FinalDecision.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                    "Final decision already made for this application");
        }

        // Update application with final decision
        application.setFinalDecision(request.decision());

        // Update status based on decision
        if (request.decision() == FinalDecision.ACCEPTED) {
            application.setStatus(ApplicationStatus.ACCEPTED);
        } else {
            application.setStatus(ApplicationStatus.REJECTED);
        }

        Application saved = applicationRepository.save(application);

        // Notify candidate
        String subject;
        String message;
        String type;

        if (request.decision() == FinalDecision.ACCEPTED) {
            subject = "Congratulations! Your application has been accepted";
            message = "Congratulations! Your application for " + application.getJobOffer().getTitle() + 
                    " has been accepted. Our HR team will contact you soon with next steps.";
            type = "APPLICATION_ACCEPTED";
        } else {
            subject = "Application Status Update";
            message = "Thank you for your interest in " + application.getJobOffer().getTitle() + 
                    ". We regret to inform you that your application has not been selected to move forward.";
            type = "APPLICATION_REJECTED";
        }

        notificationService.notify(
                application.getCandidate(),
                subject,
                message,
                type,
                "/candidate/applications/" + application.getId()
        );

        return ResponseEntity.ok(toEvaluationResponse(saved, jobOfferId));
    }

    /**
     * Convert Application to evaluation response DTO.
     */
    private JobOfferEvaluationResponse toEvaluationResponse(Application app, Long jobOfferId) {
        // Get interview if it exists
        List<Interview> interviews = interviewRepository.findByApplication_Id(app.getId());
        Interview interview = interviews.isEmpty() ? null : interviews.get(0);

        // Get form evaluator name
        String formEvaluatorName = app.getFormEvaluator() == null ? null
                : app.getFormEvaluator().getFirstName() + " " + app.getFormEvaluator().getLastName();

        // Get interview evaluator and interview evaluation scores
        String interviewEvaluatorName = null;
        BigDecimal interviewScore = null;
        if (interview != null && interview.getAssignedEvaluator() != null) {
            interviewEvaluatorName = interview.getAssignedEvaluator().getFirstName() + " " + 
                    interview.getAssignedEvaluator().getLastName();
            if (interview.getEvaluation() != null) {
                interviewScore = interview.getEvaluation().getOverallScore();
            }
        }

        return new JobOfferEvaluationResponse(
                app.getId(),
                app.getCandidate().getId(),
                app.getCandidate().getFirstName() + " " + app.getCandidate().getLastName(),
                app.getCandidate().getEmail(),
                jobOfferId,
                app.getJobOffer().getTitle(),
                app.getFormScore(),
                formEvaluatorName,
                app.getFormDecision() != null ? app.getFormDecision().toString() : null,
                interviewScore,
                interviewEvaluatorName,
                app.getFinalDecision() != null ? app.getFinalDecision().toString() : "PENDING",
                app.getFormEvaluatedAt(),
                interview != null ? interview.getScheduledAt() : null,
                null
        );
    }

    /**
     * Convert Application to detailed evaluation response.
     */
    private DetailedEvaluationResponse toDetailedResponse(Application app) {
        // Get interview evaluations
        List<Interview> interviews = interviewRepository.findByApplication_Id(app.getId());
        Interview interview = interviews.isEmpty() ? null : interviews.get(0);

        InterviewEvaluationDetail interviewEval = null;
        if (interview != null && interview.getEvaluation() != null) {
            InterviewEvaluation eval = interview.getEvaluation();
            interviewEval = new InterviewEvaluationDetail(
                    eval.getTechnicalScore(),
                    eval.getCommunicationScore(),
                    eval.getMotivationScore(),
                    eval.getProfessionalismScore(),
                    eval.getOverallScore(),
                    eval.getRecommendation() != null ? eval.getRecommendation().toString() : null,
                    eval.getHrComment(),
                    eval.getCandidateComment(),
                    eval.getCreatedAt()
            );
        }

        return new DetailedEvaluationResponse(
                app.getId(),
                app.getCandidate().getId(),
                app.getCandidate().getFirstName() + " " + app.getCandidate().getLastName(),
                app.getCandidate().getEmail(),
                app.getJobOffer().getId(),
                app.getJobOffer().getTitle(),
                app.getStatus().toString(),
                new FormEvaluationDetail(
                        app.getFormScore(),
                        app.getFormDecision() != null ? app.getFormDecision().toString() : null,
                        app.getFormHrComment(),
                        app.getFormCandidateComment(),
                        app.getFormEvaluatedAt()
                ),
                interviewEval,
                app.getFinalDecision() != null ? app.getFinalDecision().toString() : "PENDING",
                null
        );
    }

    // ============ DTOs ============

    public record JobOfferEvaluationResponse(
            Long applicationId,
            Long candidateId,
            String candidateName,
            String candidateEmail,
            Long jobOfferId,
            String jobOfferTitle,
            Integer formScore,
            String formEvaluatorName,
            String formDecision,
            BigDecimal interviewScore,
            String interviewEvaluatorName,
            String finalDecision,
            LocalDateTime formEvaluatedAt,
            LocalDateTime interviewScheduledAt,
            LocalDateTime finalDecisionAt
    ) {}

    public record DetailedEvaluationResponse(
            Long applicationId,
            Long candidateId,
            String candidateName,
            String candidateEmail,
            Long jobOfferId,
            String jobOfferTitle,
            String applicationStatus,
            FormEvaluationDetail formEvaluation,
            InterviewEvaluationDetail interviewEvaluation,
            String finalDecision,
            LocalDateTime finalDecisionAt
    ) {}

    public record FormEvaluationDetail(
            Integer score,
            String decision,
            String hrComment,
            String candidateComment,
            LocalDateTime evaluatedAt
    ) {}

    public record InterviewEvaluationDetail(
            BigDecimal technicalScore,
            BigDecimal communicationScore,
            BigDecimal motivationScore,
            BigDecimal professionalismScore,
            BigDecimal overallScore,
            String recommendation,
            String hrComment,
            String candidateComment,
            LocalDateTime evaluatedAt
    ) {}

    public record FinalDecisionRequest(FinalDecision decision) {}
}
