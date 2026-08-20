package org.example.recrutment.dto.gestionEntretiens;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;
import org.example.recrutment.entities.gestionEntretiens.InterviewType;
import org.example.recrutment.entities.gestionEntretiens.InterviewMode;

import java.time.LocalDateTime;

/**
 * Données envoyées pour créer ou modifier un entretien.
 * applicationId référence la candidature concernée -- le service vérifie
 * qu'elle existe avant de créer/modifier l'entretien.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewRequestDTO {

    @NotNull(message = "Le type d'entretien est obligatoire")
    private InterviewType interviewType;

    @NotNull(message = "La date/heure de l'entretien est obligatoire")
    private LocalDateTime scheduledAt;

    private Integer durationMinutes;

    private String location;

    private String meetingLink;

    private InterviewMode mode;

    private Long assignedEvaluatorId;

    private InterviewStatus status;

    private String notes;

    @NotNull(message = "La candidature associée est obligatoire")
    private Long applicationId;
}
