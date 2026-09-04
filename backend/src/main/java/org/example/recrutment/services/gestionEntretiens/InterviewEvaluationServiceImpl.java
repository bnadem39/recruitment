package org.example.recrutment.services.gestionEntretiens;

import org.example.recrutment.dto.gestionEntretiens.InterviewEvaluationRequestDTO;
import org.example.recrutment.dto.gestionEntretiens.InterviewEvaluationResponseDTO;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.gestionEntretiens.InterviewEvaluation;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.repositories.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;


@Service
public class InterviewEvaluationServiceImpl implements InterviewEvaluationService {

    private final InterviewRepository interviewRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Autowired
    public InterviewEvaluationServiceImpl(InterviewRepository interviewRepository,
                                          NotificationService notificationService, UserRepository userRepository) {
        this.interviewRepository = interviewRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    /** Retained for existing unit tests and callers that only assert candidate notification behaviour. */
    public InterviewEvaluationServiceImpl(InterviewRepository interviewRepository,
                                          NotificationService notificationService) {
        this(interviewRepository, notificationService, null);
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public InterviewEvaluationResponseDTO create(Long interviewId, InterviewEvaluationRequestDTO request) {
        Interview interview = findInterviewOrThrow(interviewId);

        if (!isCompletedOrFinished(interview)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only completed interviews can be evaluated");
        }

        if (interview.getEvaluation() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This interview already has an interview evaluation. Use PUT to update it; the application form evaluation is stored separately and does not block this record.");
        }

        InterviewEvaluation evaluation = InterviewEvaluation.builder()
                .technicalScore(request.getTechnicalScore())
                .communicationScore(request.getCommunicationScore())
                .motivationScore(request.getMotivationScore())
                .professionalismScore(request.getProfessionalismScore())
                .overallScore(request.getOverallScore())
                .recommendation(request.getRecommendation())
                .hrComment(request.getHrComment().trim())
                .candidateComment(request.getCandidateComment().trim())
                .build();

        interview.setEvaluation(evaluation);
        Interview savedInterview = interviewRepository.save(interview);

        notifyEvaluationCompleted(savedInterview, false);
        return toResponseDTO(savedInterview.getId(), savedInterview.getEvaluation());
    }

    // ==================== Read ====================

    @Override
    public InterviewEvaluationResponseDTO getByInterview(Long interviewId) {
        Interview interview = findInterviewOrThrow(interviewId);
        InterviewEvaluation evaluation = findEvaluationOrThrow(interview);
        return toResponseDTO(interview.getId(), evaluation);
    }

    // ==================== Update ====================

    @Override
    @Transactional
    public InterviewEvaluationResponseDTO update(Long interviewId, InterviewEvaluationRequestDTO request) {
        Interview interview = findInterviewOrThrow(interviewId);
        InterviewEvaluation evaluation = findEvaluationOrThrow(interview);

        evaluation.setTechnicalScore(request.getTechnicalScore());
        evaluation.setCommunicationScore(request.getCommunicationScore());
        evaluation.setMotivationScore(request.getMotivationScore());
        evaluation.setProfessionalismScore(request.getProfessionalismScore());
        evaluation.setOverallScore(request.getOverallScore());
        evaluation.setRecommendation(request.getRecommendation());
        evaluation.setHrComment(request.getHrComment().trim());
        evaluation.setCandidateComment(request.getCandidateComment().trim());

        Interview savedInterview = interviewRepository.save(interview);
        notifyEvaluationCompleted(savedInterview, true);
        return toResponseDTO(savedInterview.getId(), savedInterview.getEvaluation());
    }

    // ==================== Delete ====================

    @Override
    @Transactional
    public void delete(Long interviewId) {
        Interview interview = findInterviewOrThrow(interviewId);
        findEvaluationOrThrow(interview); // vérifie qu'il y a bien quelque chose à supprimer
        interview.setEvaluation(null); // orphanRemoval supprime la ligne InterviewEvaluation en base
        interviewRepository.save(interview);
    }

    // ==================== Méthodes utilitaires privées ====================

    private Interview findInterviewOrThrow(Long interviewId) {
        return interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Entretien introuvable avec l'id : " + interviewId));
    }

    private InterviewEvaluation findEvaluationOrThrow(Interview interview) {
        if (interview.getEvaluation() == null) {
            throw new ResourceNotFoundException(
                    "Aucune évaluation trouvée pour l'entretien : " + interview.getId());
        }
        return interview.getEvaluation();
    }

        private boolean isCompletedOrFinished(Interview interview) {
        if (interview.getStatus() == InterviewStatus.COMPLETED) return true;
        if (interview.getStatus() != InterviewStatus.SCHEDULED
            && interview.getStatus() != InterviewStatus.IN_PROGRESS) return false;

        LocalDateTime scheduledEnd = interview.getScheduledAt().plusMinutes(
            interview.getDurationMinutes() != null ? interview.getDurationMinutes() : 60);
        if (LocalDateTime.now().isBefore(scheduledEnd)) return false;

        interview.setStatus(InterviewStatus.COMPLETED);
        return true;
        }

    private InterviewEvaluationResponseDTO toResponseDTO(Long interviewId, InterviewEvaluation evaluation) {
        return InterviewEvaluationResponseDTO.builder()
                .id(evaluation.getId())
                .interviewId(interviewId)
                .technicalScore(evaluation.getTechnicalScore())
                .communicationScore(evaluation.getCommunicationScore())
                .motivationScore(evaluation.getMotivationScore())
                .professionalismScore(evaluation.getProfessionalismScore())
                .overallScore(evaluation.getOverallScore())
                .recommendation(evaluation.getRecommendation())
                .hrComment(evaluation.getHrComment() != null ? evaluation.getHrComment() : evaluation.getLegacyComment())
                .candidateComment(evaluation.getCandidateComment())
                .createdAt(evaluation.getCreatedAt())
                .build();
    }

    private void notifyEvaluationCompleted(Interview interview, boolean updated) {
        InterviewEvaluation evaluation = interview.getEvaluation();
        String jobTitle = interview.getApplication().getJobOffer().getTitle();
        notificationService.notify(
                interview.getApplication().getCandidate(),
                "Interview evaluation completed",
                "Your interview evaluation for " + jobTitle + " has been completed.",
                updated ? "INTERVIEW_EVALUATION_UPDATED" : "INTERVIEW_EVALUATION_SUBMITTED",
                "/candidate/interviews/" + interview.getId());
        if (userRepository != null) userRepository.findByUserRoleOrderByFirstNameAscLastNameAsc(UserRole.HR).forEach(hr -> notificationService.notify(hr,
                    "Interview evaluation completed", "The interview evaluation for "
                            + interview.getApplication().getCandidate().getFirstName() + " "
                            + interview.getApplication().getCandidate().getLastName() + " has been completed.",
                    "INTERVIEW_EVALUATION_SUBMITTED", "/hr/reviews/interviews"));
    }
}
