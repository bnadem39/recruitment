package org.example.recrutment.entities.gestionEntretiens;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
    @Column(name = "overall_score", precision = 4, scale = 2)
    private BigDecimal overallScore;

    // ==================== Avis de l'évaluateur ====================

    @Enumerated(EnumType.STRING)
    private Recommendation recommendation;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ==================== Relations ====================

}
