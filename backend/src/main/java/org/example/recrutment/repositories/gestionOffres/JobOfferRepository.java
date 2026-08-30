package org.example.recrutment.repositories.gestionOffres;

import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.gestionOffres.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobOfferRepository extends JpaRepository<JobOffer, Long> {

    /** Offres publiées, utile pour l'espace candidat (liste des offres visibles). */
    List<JobOffer> findByStatus(OfferStatus status);

    Optional<JobOffer> findByTitleIgnoreCase(String title);

    /** Détache les offres d'un formulaire avant suppression du form. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE JobOffer o SET o.form = null WHERE o.form.formId = :formId")
    void clearFormId(@Param("formId") Long formId);
}