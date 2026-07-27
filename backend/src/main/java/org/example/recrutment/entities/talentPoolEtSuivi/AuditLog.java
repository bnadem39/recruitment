package org.example.recrutment.entities.talentPoolEtSuivi;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class AuditLog {

    // ==================== Identifiant ====================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== Attributs ====================

    /** Action réalisée, ex: "CREATE", "UPDATE", "DELETE", "AI_PRESCREENING". */
    @Column(nullable = false)
    private String action;

    /** Type de l'entité concernée, ex: "Application", "JobOffer", "Form". */
    @Column(name = "entity_type", nullable = false)
    private String entityType;

    /** Identifiant de l'entité concernée (référence générique, pas de FK JPA). */
    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ==================== Relations ====================

}
