package org.example.recrutment.repositories.candidatures;

import org.example.recrutment.entities.candidatures.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    /** Toutes les candidatures déposées par un candidat donné. */
    List<Application> findByCandidate_Id(Long candidateId);

    /** Toutes les candidatures reçues pour une offre donnée. */
    List<Application> findByJobOffer_Id(Long jobOfferId);
}