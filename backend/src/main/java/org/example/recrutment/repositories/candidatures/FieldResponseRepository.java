package org.example.recrutment.repositories.candidatures;

import org.example.recrutment.entities.candidatures.FieldResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FieldResponseRepository extends JpaRepository<FieldResponse, Long> {
    List<FieldResponse> findByApplication_Id(Long applicationId);
    Optional<FieldResponse> findByApplication_IdAndField_Id(Long applicationId, Long fieldId);
}
