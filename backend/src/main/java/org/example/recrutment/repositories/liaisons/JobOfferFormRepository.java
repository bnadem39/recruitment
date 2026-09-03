package org.example.recrutment.repositories.liaisons;

import org.example.recrutment.entities.liaisons.JobOfferForm;
import org.example.recrutment.entities.liaisons.JobOfferFormId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobOfferFormRepository
        extends JpaRepository<JobOfferForm, JobOfferFormId> {
}
