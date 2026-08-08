package org.example.recrutment.repositories.formulairesAdaptatifs;

import org.example.recrutment.entities.formulairesAdaptatifs.FieldCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA pour FieldCondition.
 * Une condition relie deux FormField (source et cible) qui appartiennent
 * tous deux au même formulaire. On navigue via targetField.form.formId
 * pour retrouver les conditions d'un formulaire donné.
 */
@Repository
public interface FieldConditionRepository extends JpaRepository<FieldCondition, Long> {

    List<FieldCondition> findByTargetField_Form_FormId(Long formId);

    Optional<FieldCondition> findByIdAndTargetField_Form_FormId(Long conditionId, Long formId);
}
