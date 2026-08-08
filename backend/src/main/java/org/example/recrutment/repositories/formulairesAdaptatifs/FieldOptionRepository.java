package org.example.recrutment.repositories.formulairesAdaptatifs;

import org.example.recrutment.entities.formulairesAdaptatifs.FieldOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA pour FieldOption.
 * Navigue via FormField_Id pour récupérer les options d'un champ précis
 * (relation imbriquée FormField -> FieldOption).
 */
@Repository
public interface FieldOptionRepository extends JpaRepository<FieldOption, Long> {

    List<FieldOption> findByFormField_IdOrderByDisplayOrderAsc(Long fieldId);

    Optional<FieldOption> findByIdAndFormField_Id(Long optionId, Long fieldId);
}
