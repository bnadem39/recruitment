package org.example.recrutment.repositories.gestionOffres;

import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.gestionOffres.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobOfferRepository extends JpaRepository<JobOffer, Long> {

    /** Offres publiées, utile pour l'espace candidat (liste des offres visibles). */
    List<JobOffer> findByStatus(OfferStatus status);
    Optional<JobOffer> findByTitleIgnoreCase(String title);
}
