package org.example.recrutment.repositories.candidatures;

import org.example.recrutment.entities.candidatures.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByCandidate_Id(Long candidateId);
    List<Application> findByJobOffer_Id(Long jobOfferId);
    Optional<Application> findByCandidate_IdAndJobOffer_Id(Long candidateId, Long jobOfferId);
    boolean existsByCandidate_IdAndJobOffer_Id(Long candidateId, Long jobOfferId);
}
