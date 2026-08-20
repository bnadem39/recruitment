package org.example.recrutment.dto.gestionEntretiens;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;
import org.example.recrutment.entities.gestionEntretiens.InterviewType;
import org.example.recrutment.entities.gestionEntretiens.InterviewMode;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewResponseDTO {

    private Long id;
    private InterviewType interviewType;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    private String location;
    private String meetingLink;
    private InterviewMode mode;
    private Long assignedEvaluatorId;
    private InterviewStatus status;
    private String notes;
    private Long applicationId;
    /** Présent uniquement si une évaluation a déjà été saisie pour cet entretien. */
    private Long evaluationId;
    private LocalDateTime createdAt;
}
