package org.example.recrutment.repositories.candidatures;

import jakarta.transaction.Transactional;
import org.example.recrutment.entities.candidatures.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByCandidate_Id(Long candidateId);
    List<Application> findByJobOffer_Id(Long jobOfferId);
    Optional<Application> findByCandidate_IdAndJobOffer_Id(Long candidateId, Long jobOfferId);
    boolean existsByCandidate_IdAndJobOffer_Id(Long candidateId, Long jobOfferId);
    List<Application> findByJobOffer_IdIn(List<Long> jobOfferIds);

    @Modifying
    @Transactional
    @Query("UPDATE Application a SET a.formEvaluator = null WHERE a.formEvaluator.id = :userId")
    void unassignFormEvaluator(Long userId);
}
