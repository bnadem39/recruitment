package org.example.recrutment.repositories.candidatures;

import org.example.recrutment.entities.candidatures.ApplicationDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, Long> {
    /**
     * Find all documents for a specific application.
     * Used by Evaluators to access documents of assigned applications.
     * Used by Candidates to access their own documents.
     */
    List<ApplicationDocument> findByApplication_Id(Long applicationId);

    /**
     * Find all documents for a specific candidate across all their applications.
     * Used for bulk operations or audit purposes.
     */
    List<ApplicationDocument> findByApplication_Candidate_Id(Long candidateId);
}
