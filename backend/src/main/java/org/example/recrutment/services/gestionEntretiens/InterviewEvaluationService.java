package org.example.recrutment.services.gestionEntretiens;

import org.example.recrutment.dto.gestionEntretiens.InterviewEvaluationRequestDTO;
import org.example.recrutment.dto.gestionEntretiens.InterviewEvaluationResponseDTO;

/**
 * Contrat des opérations métier sur l'évaluation d'un entretien.
 * Relation OneToOne : un Interview a au plus une InterviewEvaluation,
 * donc pas de getAll()/getById() classique -- tout est indexé par interviewId.
 */
public interface InterviewEvaluationService {

    InterviewEvaluationResponseDTO create(Long interviewId, InterviewEvaluationRequestDTO request);

    InterviewEvaluationResponseDTO getByInterview(Long interviewId);

    InterviewEvaluationResponseDTO update(Long interviewId, InterviewEvaluationRequestDTO request);

    void delete(Long interviewId);
}
