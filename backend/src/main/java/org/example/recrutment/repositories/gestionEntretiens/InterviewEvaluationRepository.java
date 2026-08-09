package org.example.recrutment.repositories.gestionEntretiens;

import org.example.recrutment.entities.gestionEntretiens.InterviewEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface InterviewEvaluationRepository extends JpaRepository<InterviewEvaluation, Long> {
}
