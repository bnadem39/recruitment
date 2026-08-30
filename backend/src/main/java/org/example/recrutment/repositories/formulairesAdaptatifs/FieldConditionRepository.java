package org.example.recrutment.repositories.formulairesAdaptatifs;

import org.example.recrutment.entities.formulairesAdaptatifs.FieldCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FieldConditionRepository extends JpaRepository<FieldCondition, Long> {

    List<FieldCondition> findByTargetField_Form_FormId(Long formId);

    Optional<FieldCondition> findByIdAndTargetField_Form_FormId(Long id, Long formId);

    // Suppression de toutes les conditions d'un formulaire
    @Modifying
    @Query("""
        DELETE FROM FieldCondition c
        WHERE c.sourceField.id IN (
            SELECT f.id FROM FormField f WHERE f.form.formId = :formId
        )
        OR c.targetField.id IN (
            SELECT f.id FROM FormField f WHERE f.form.formId = :formId
        )
        """)
    void deleteAllByFormId(@Param("formId") Long formId);

    // Suppression des conditions liées à un champ précis
    @Modifying
    @Query("""
        DELETE FROM FieldCondition c
        WHERE c.sourceField.id = :fieldId
           OR c.targetField.id = :fieldId
        """)
    void deleteAllByFieldId(@Param("fieldId") Long fieldId);
}
