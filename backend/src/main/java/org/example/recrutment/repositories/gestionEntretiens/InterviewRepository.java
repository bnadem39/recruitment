package org.example.recrutment.repositories.gestionEntretiens;

import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    /** Tous les entretiens d'une candidature donnée. */
    List<Interview> findByApplication_Id(Long applicationId);
}
