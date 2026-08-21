package org.example.recrutment.services.gestionEntretiens;

import org.example.recrutment.dto.gestionEntretiens.InterviewEvaluationRequestDTO;
import org.example.recrutment.dto.gestionEntretiens.InterviewEvaluationResponseDTO;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.gestionEntretiens.InterviewEvaluation;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;


@Service
public class InterviewEvaluationServiceImpl implements InterviewEvaluationService {

    private final InterviewRepository interviewRepository;
    private final NotificationService notificationService;

    public InterviewEvaluationServiceImpl(InterviewRepository interviewRepository,
                                          NotificationService notificationService) {
        this.interviewRepository = interviewRepository;
        this.notificationService = notificationService;
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public InterviewEvaluationResponseDTO create(Long interviewId, InterviewEvaluationRequestDTO request) {
        Interview interview = findInterviewOrThrow(interviewId);

        if (interview.getEvaluation() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cet entretien a déjà une évaluation. Utilisez PUT pour la modifier.");
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

        notifyCandidate(savedInterview, false);
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
        notifyCandidate(savedInterview, true);
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

    private void notifyCandidate(Interview interview, boolean updated) {
        InterviewEvaluation evaluation = interview.getEvaluation();
        String jobTitle = interview.getApplication().getJobOffer().getTitle();
        notificationService.notify(
                interview.getApplication().getCandidate(),
                updated ? "Evaluation mise a jour" : "Resultat de votre entretien disponible",
                "Votre note pour " + jobTitle + " est " + evaluation.getOverallScore()
                        + "/20. Recommandation : " + evaluation.getRecommendation() + ".",
                updated ? "INTERVIEW_EVALUATION_UPDATED" : "INTERVIEW_EVALUATION_SUBMITTED",
                "/candidate/interviews/" + interview.getId());
    }
}
