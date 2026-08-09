package org.example.recrutment.dto.gestionEntretiens;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.gestionEntretiens.Recommendation;

import java.math.BigDecimal;

/**
 * Données envoyées pour créer ou modifier l'évaluation d'un entretien.
 * Un seul InterviewEvaluation par Interview (relation OneToOne) -- l'URL
 * ne contient donc pas d'id d'évaluation, uniquement l'interviewId.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewEvaluationRequestDTO {

    @DecimalMin(value = "0.0", message = "Le score technique doit être entre 0 et 20")
    @DecimalMax(value = "20.0", message = "Le score technique doit être entre 0 et 20")
    private BigDecimal technicalScore;

    @DecimalMin(value = "0.0", message = "Le score de communication doit être entre 0 et 20")
    @DecimalMax(value = "20.0", message = "Le score de communication doit être entre 0 et 20")
    private BigDecimal communicationScore;

    @DecimalMin(value = "0.0", message = "Le score de motivation doit être entre 0 et 20")
    @DecimalMax(value = "20.0", message = "Le score de motivation doit être entre 0 et 20")
    private BigDecimal motivationScore;

    @DecimalMin(value = "0.0", message = "Le score de professionnalisme doit être entre 0 et 20")
    @DecimalMax(value = "20.0", message = "Le score de professionnalisme doit être entre 0 et 20")
    private BigDecimal professionalismScore;

    @DecimalMin(value = "0.0", message = "Le score global doit être entre 0 et 20")
    @DecimalMax(value = "20.0", message = "Le score global doit être entre 0 et 20")
    private BigDecimal overallScore;

    private Recommendation recommendation;

    private String comment;
}
