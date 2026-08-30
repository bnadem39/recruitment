package org.example.recrutment.hr;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EvaluatorAssignmentRepository extends JpaRepository<EvaluatorAssignment, EvaluatorAssignmentId> {
    @Query("select assignment from EvaluatorAssignment assignment "
            + "join fetch assignment.offer join fetch assignment.evaluator")
    List<EvaluatorAssignment> findAllWithDetails();

    @Query("select assignment from EvaluatorAssignment assignment join fetch assignment.evaluator "
            + "where assignment.offer.id = :offerId")
    List<EvaluatorAssignment> findByOfferIdWithEvaluator(@Param("offerId") Long offerId);

    @Query("select assignment from EvaluatorAssignment assignment join fetch assignment.offer "
            + "where assignment.evaluator.id = :evaluatorId")
    List<EvaluatorAssignment> findByEvaluatorIdWithOffer(@Param("evaluatorId") Long evaluatorId);

    @Modifying
    @Query("delete from EvaluatorAssignment assignment where assignment.offer.id = :offerId")
    void deleteByOfferId(@Param("offerId") Long offerId);
}
