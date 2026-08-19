package org.example.recrutment.repositories.candidatures;

import org.example.recrutment.entities.users.Candidates;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CandidatesRepository extends JpaRepository<Candidates, Long> {
}
