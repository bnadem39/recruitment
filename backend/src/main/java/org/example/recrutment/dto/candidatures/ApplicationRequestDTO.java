package org.example.recrutment.dto.candidatures;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.candidatures.ApplicationStatus;
import org.example.recrutment.entities.candidatures.FinalDecision;
import org.example.recrutment.entities.candidatures.RecruitmentStage;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationRequestDTO {

    @NotNull(message = "Le candidat est obligatoire")
    private Long candidateId;

    @NotNull(message = "L'offre d'emploi est obligatoire")
    private Long jobOfferId;

    private ApplicationStatus status;

    private RecruitmentStage currentStage;

    private FinalDecision finalDecision;

    private String rejectionReason;

    private String withdrawalReason;
}
