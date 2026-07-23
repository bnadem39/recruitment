package org.example.recrutment.entities.gestionOffres;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.formulairesAdaptatifs.Form;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_offers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class JobOffer {

    // ==================== Identifiant ====================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== Attributs ====================

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Département/service demandeur au sein de la BFPME (ex: "Direction Financière"). */
    @Column(name = "department")
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", nullable = false)
    private ContactType contractType;

    private String location;

    /** Nombre de postes ouverts pour cette offre. */
    @Column(name = "number_of_positions", nullable = false)
    @Builder.Default
    private Integer numberOfPositions = 1;

    @Column(name = "publication_date")
    private LocalDate publicationDate;

    /** Date limite de dépôt des candidatures. */
    @Column(name = "deadline")
    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OfferStatus status = OfferStatus.DRAFT;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ==================== Relations ====================

}