package org.example.recrutment.dto.candidatures;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.candidatures.ApplicationStatus;
import org.example.recrutment.entities.candidatures.FinalDecision;
import org.example.recrutment.entities.candidatures.RecruitmentStage;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationResponseDTO {

    private Long id;
    private ApplicationStatus status;
    private RecruitmentStage currentStage;
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;
    private FinalDecision finalDecision;
    private String rejectionReason;
    private String withdrawalReason;
    private Long candidateId;
    private Long jobOfferId;
}
