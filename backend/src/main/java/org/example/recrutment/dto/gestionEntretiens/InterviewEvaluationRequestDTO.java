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

/** Request for the one evaluation associated with an interview. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewEvaluationRequestDTO {
    @DecimalMin(value = "0.0") @DecimalMax(value = "20.0") @NotNull
    private BigDecimal technicalScore;
    @DecimalMin(value = "0.0") @DecimalMax(value = "20.0") @NotNull
    private BigDecimal communicationScore;
    @DecimalMin(value = "0.0") @DecimalMax(value = "20.0") @NotNull
    private BigDecimal motivationScore;
    @DecimalMin(value = "0.0") @DecimalMax(value = "20.0") @NotNull
    private BigDecimal professionalismScore;
    @DecimalMin(value = "0.0") @DecimalMax(value = "100.0") @NotNull
    private BigDecimal overallScore;
    @NotNull private Recommendation recommendation;
    @NotBlank @Size(max = 5000) private String hrComment;
    @NotBlank @Size(max = 5000) private String candidateComment;
}
