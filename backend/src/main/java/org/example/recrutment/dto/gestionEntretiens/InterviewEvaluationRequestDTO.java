package org.example.recrutment.dto.gestionEntretiens;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
    @NotNull(message = "Le score technique est obligatoire")
    private BigDecimal technicalScore;

    @DecimalMin(value = "0.0", message = "Le score de communication doit être entre 0 et 20")
    @DecimalMax(value = "20.0", message = "Le score de communication doit être entre 0 et 20")
    @NotNull(message = "Le score de communication est obligatoire")
    private BigDecimal communicationScore;

    @DecimalMin(value = "0.0", message = "Le score de motivation doit être entre 0 et 20")
    @DecimalMax(value = "20.0", message = "Le score de motivation doit être entre 0 et 20")
    @NotNull(message = "Le score de motivation est obligatoire")
    private BigDecimal motivationScore;

    @DecimalMin(value = "0.0", message = "Le score de professionnalisme doit être entre 0 et 20")
    @DecimalMax(value = "20.0", message = "Le score de professionnalisme doit être entre 0 et 20")
    @NotNull(message = "Le score de professionnalisme est obligatoire")
    private BigDecimal professionalismScore;

    @DecimalMin(value = "0.0", message = "Le score global doit être entre 0 et 20")
    @DecimalMax(value = "20.0", message = "Le score global doit être entre 0 et 20")
    @NotNull(message = "Le score global est obligatoire")
    private BigDecimal overallScore;

    @NotNull(message = "La recommandation est obligatoire")
    private Recommendation recommendation;

    @NotBlank(message = "Le commentaire destine aux RH est obligatoire")
    @Size(max = 5000, message = "Le commentaire RH ne peut pas depasser 5000 caracteres")
    private String hrComment;

    @NotBlank(message = "Le commentaire destine au candidat est obligatoire")
    @Size(max = 5000, message = "Le commentaire candidat ne peut pas depasser 5000 caracteres")
    private String candidateComment;
}
