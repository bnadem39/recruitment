package org.example.recrutment.entities.application;

import jakarta.persistence.*;
import lombok.*;
import org.example.recrutment.entities.users.Candidates;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidates candidate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecruitmentStage currentStage;

    private LocalDateTime submittedAt;
    private LocalDateTime updatedAtDate;
    private LocalDateTime finalDecisionAt;

    @Enumerated(EnumType.STRING)
    private FinalDecision finalDecision;

    @Column(length = 255)
    private String rejectionReason;

    @Column(length = 255)
    private String withdrawalReason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
