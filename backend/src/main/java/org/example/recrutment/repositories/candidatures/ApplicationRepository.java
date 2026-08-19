package org.example.recrutment.repositories.candidatures;

import org.example.recrutment.entities.candidatures.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByCandidate_Id(Long candidateId);
    List<Application> findByJobOffer_Id(Long jobOfferId);
}
