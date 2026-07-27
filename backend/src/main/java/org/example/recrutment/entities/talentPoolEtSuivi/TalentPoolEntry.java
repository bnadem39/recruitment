package org.example.recrutment.entities.talentPoolEtSuivi;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "talent_pool_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class TalentPoolEntry {

    // ==================== Identifiant ====================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== Attributs ====================

    /** Catégorie de profil (ex: "Financier", "IT", "Chauffeur") pour faciliter la recherche future. */
    private String category;

    @Column(columnDefinition = "TEXT")
    private String skills;

    // ==================== Consentement (conformité) ====================

    @Column(name = "consent_given", nullable = false)
    @Builder.Default
    private Boolean consentGiven = false;

    @Column(name = "consent_date")
    private LocalDate consentDate;

    @Column(name = "consent_expiration_date")
    private LocalDate consentExpirationDate;

    // ==================== Statut et suivi ====================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TalentPoolStatus status = TalentPoolStatus.ACTIVE;

    /** Notes internes RH sur ce profil (contexte, historique de contact...). */
    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ==================== Relations ====================

}
