package org.example.recrutment.entities.liaisons;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.formulairesAdaptatifs.Form;
import org.example.recrutment.entities.gestionOffres.JobOffer;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_offer_forms")
@IdClass(JobOfferFormId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobOfferForm {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_offer_id", nullable = false)
    private JobOffer jobOffer;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "form_id", nullable = false)
    private Form form;

    @Column(name = "linked_at", nullable = false)
    private LocalDateTime linkedAt;

    @Column(name = "is_primary", nullable = false)
    private boolean primaryForm;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean required;
}