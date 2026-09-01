package org.example.recrutment.controllers.hr;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.candidatures.ApplicationStatus;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.gestionEntretiens.InterviewEvaluation;
import org.example.recrutment.entities.gestionEntretiens.Recommendation;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/hr/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class HrRecruitmentReviewController {
    private final ApplicationRepository applications;
    private final InterviewRepository interviews;

    @GetMapping("/applications")
    @Transactional(readOnly = true)
    public List<FormReviewResponse> formEvaluations() {
        return applications.findAll().stream()
                .filter(application -> application.getFormEvaluatedAt() != null)
                .sorted(Comparator.comparing(Application::getFormEvaluatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toFormReview)
                .toList();
    }

    @GetMapping("/interviews")
    @Transactional(readOnly = true)
    public List<InterviewReviewResponse> interviewEvaluations() {
        return interviews.findAll().stream()
                .filter(interview -> interview.getEvaluation() != null)
                .sorted(Comparator.comparing(interview -> interview.getEvaluation().getCreatedAt(),
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toInterviewReview)
                .toList();
    }

    private FormReviewResponse toFormReview(Application application) {
        String evaluatorName = application.getFormEvaluator() == null ? null
                : application.getFormEvaluator().getFirstName() + " " + application.getFormEvaluator().getLastName();
        return new FormReviewResponse(application.getId(), application.getStatus(),
                application.getCandidate().getFirstName() + " " + application.getCandidate().getLastName(),
                application.getJobOffer().getTitle(), evaluatorName, application.getFormScore(),
                application.getFormHrComment(), application.getFormCandidateComment(), application.getFormEvaluatedAt());
    }

    private InterviewReviewResponse toInterviewReview(Interview interview) {
        InterviewEvaluation evaluation = interview.getEvaluation();
        Application application = interview.getApplication();
        String evaluatorName = interview.getAssignedEvaluator() == null ? null
                : interview.getAssignedEvaluator().getFirstName() + " " + interview.getAssignedEvaluator().getLastName();
        return new InterviewReviewResponse(interview.getId(), application.getId(),
                application.getCandidate().getFirstName() + " " + application.getCandidate().getLastName(),
                application.getJobOffer().getTitle(), evaluatorName, interview.getScheduledAt(),
                evaluation.getOverallScore(), evaluation.getHrComment(), evaluation.getRecommendation(),
                evaluation.getCreatedAt());
    }

    public record FormReviewResponse(Long applicationId, ApplicationStatus status, String candidateName,
                                     String jobOfferTitle, String evaluatorName, Integer score, String commentForHR,
                                     String commentForCandidate, LocalDateTime evaluatedAt) {}
    public record InterviewReviewResponse(Long interviewId, Long applicationId, String candidateName,
                                           String jobOfferTitle, String evaluatorName, LocalDateTime interviewDate,
                                           BigDecimal score, String commentForHR, Recommendation decision,
                                           LocalDateTime evaluatedAt) {}
}
