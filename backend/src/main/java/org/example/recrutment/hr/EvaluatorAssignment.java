package org.example.recrutment.hr;

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
import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.users.Users;

@Entity
@Table(name = "job_offer_evaluators")
@IdClass(EvaluatorAssignmentId.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluatorAssignment {
    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_offer_id", nullable = false)
    private JobOffer offer;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evaluator_id", nullable = false)
    private Users evaluator;
}
