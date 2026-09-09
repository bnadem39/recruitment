package org.example.recrutment.repositories.talentPool;

import org.example.recrutment.entities.talentpool.TalentPoolEntry;
import org.example.recrutment.entities.talentpool.TalentPoolStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TalentPoolEntryRepository extends JpaRepository<TalentPoolEntry, Long> {

    /**
     * Find if a candidate already exists in a specific category in talent pool.
     * Used to prevent duplicates with same status.
     */
    Optional<TalentPoolEntry> findByCandidate_IdAndCategoryAndStatus(Long candidateId, String category, TalentPoolStatus status);

    /**
     * Find all active talent pool entries for a candidate.
     */
    List<TalentPoolEntry> findByCandidate_IdAndStatus(Long candidateId, TalentPoolStatus status);

    /**
     * Find all talent pool entries by status (for filtering/browsing).
     */
    List<TalentPoolEntry> findByStatus(TalentPoolStatus status);

    /**
     * Find all talent pool entries by category (for browsing by skill domain).
     */
    List<TalentPoolEntry> findByCategory(String category);

    /**
     * Find valid talent pool entries (active and not expired consent).
     * Used for compliance and GDPR checks.
     */
    @Query("SELECT t FROM TalentPoolEntry t WHERE t.status = :status " +
           "AND (t.consentExpirationDate IS NULL OR t.consentExpirationDate > :today)")
    List<TalentPoolEntry> findValidEntriesByStatus(TalentPoolStatus status, LocalDate today);

    /**
     * Search for talent pool entries by candidate name and category.
     * Used by HR for search functionality.
     */
    @Query("SELECT t FROM TalentPoolEntry t WHERE t.status = :status " +
           "AND (t.candidate.firstName LIKE LOWER(:searchTerm) " +
           "OR t.candidate.lastName LIKE LOWER(:searchTerm) " +
           "OR t.candidate.email LIKE LOWER(:searchTerm) " +
           "OR t.category LIKE LOWER(:searchTerm))")
    List<TalentPoolEntry> searchByStatusAndTerm(TalentPoolStatus status, String searchTerm);
}
