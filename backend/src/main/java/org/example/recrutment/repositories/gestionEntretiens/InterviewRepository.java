package org.example.recrutment.repositories.gestionEntretiens;

import jakarta.transaction.Transactional;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    /** Tous les entretiens d'une candidature donnée. */
    List<Interview> findByApplication_Id(Long applicationId);
    List<Interview> findByApplication_Candidate_Id(Long candidateId);
    List<Interview> findByAssignedEvaluator_Id(Long evaluatorId);

    @Modifying
    @Transactional
    @Query("UPDATE Interview i SET i.assignedEvaluator = null WHERE i.assignedEvaluator.id = :userId")
    void unassignEvaluator(Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Interview i WHERE i.application.jobOffer.id = :offerId")
    void deleteByApplicationJobOfferId(Long offerId);
}
