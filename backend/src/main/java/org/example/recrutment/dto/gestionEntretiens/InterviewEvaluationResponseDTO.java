package org.example.recrutment.dto.gestionEntretiens;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.gestionEntretiens.Recommendation;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewEvaluationResponseDTO {

    private Long id;
    private Long interviewId;
    private BigDecimal technicalScore;
    private BigDecimal communicationScore;
    private BigDecimal motivationScore;
    private BigDecimal professionalismScore;
    private BigDecimal overallScore;
    private Recommendation recommendation;
    private String hrComment;
    private String candidateComment;
    private LocalDateTime createdAt;
}
