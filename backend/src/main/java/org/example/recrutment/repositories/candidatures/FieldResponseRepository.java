package org.example.recrutment.repositories.candidatures;

import jakarta.transaction.Transactional;
import org.example.recrutment.entities.candidatures.FieldResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FieldResponseRepository extends JpaRepository<FieldResponse, Long> {
    List<FieldResponse> findByApplication_Id(Long applicationId);
    Optional<FieldResponse> findByApplication_IdAndField_Id(Long applicationId, Long fieldId);

    @Modifying
    @Transactional
    @Query("DELETE FROM FieldResponse fr WHERE fr.application.jobOffer.id = :offerId")
    void deleteByApplicationJobOfferId(Long offerId);
}
