package org.example.recrutment.repositories.users;

import org.example.recrutment.entities.users.Candidates;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface CandidateRepository extends JpaRepository<Candidates, Long> {
}
