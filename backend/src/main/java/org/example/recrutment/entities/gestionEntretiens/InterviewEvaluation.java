package org.example.recrutment.entities.gestionEntretiens;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
@Table(name = "interview_evaluations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class InterviewEvaluation {

    // ==================== Identifiant ====================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== Scores détaillés ====================

    @Column(name = "technical_score", precision = 4, scale = 2)
    private BigDecimal technicalScore;

    @Column(name = "communication_score", precision = 4, scale = 2)
    private BigDecimal communicationScore;

    @Column(name = "motivation_score", precision = 4, scale = 2)
    private BigDecimal motivationScore;

    @Column(name = "professionalism_score", precision = 4, scale = 2)
    private BigDecimal professionalismScore;

    /** Score global, calculé (moyenne pondérée) ou saisi directement par l'évaluateur. */
    @Column(name = "overall_score", precision = 5, scale = 2)
    private BigDecimal overallScore;

    // ==================== Avis de l'évaluateur ====================

    @Enumerated(EnumType.STRING)
    private Recommendation recommendation;

    /** Justification interne visible uniquement par l'evaluateur et l'equipe RH. */
    @Column(name = "hr_comment", columnDefinition = "TEXT")
    private String hrComment;

    /** Retour partage avec le candidat lorsque l'evaluation est soumise. */
    @Column(name = "candidate_comment", columnDefinition = "TEXT")
    private String candidateComment;

    /** Ancienne colonne conservee pour relire les evaluations creees avant la separation des commentaires. */
    @Column(name = "comment", columnDefinition = "TEXT")
    private String legacyComment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ==================== Relations ====================

    @OneToOne(mappedBy = "evaluation", fetch = FetchType.LAZY)
    private Interview interview;

    // ==================== Callbacks JPA ====================

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

}
