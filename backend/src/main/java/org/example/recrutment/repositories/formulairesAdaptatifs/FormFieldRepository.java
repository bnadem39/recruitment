package org.example.recrutment.repositories.formulairesAdaptatifs;

import org.example.recrutment.entities.formulairesAdaptatifs.FormField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FormFieldRepository extends JpaRepository<FormField, Long> {

    /** Tous les champs d'un formulaire donné, triés par ordre d'affichage. */
    List<FormField> findByForm_FormIdOrderByDisplayOrderAsc(Long formId);

    /** Un champ précis, en vérifiant qu'il appartient bien au formulaire donné. */
    Optional<FormField> findByIdAndForm_FormId(Long fieldId, Long formId);

    @Modifying
    @Query("DELETE FROM FormField f WHERE f.form.formId = :formId")
    void deleteByForm_FormId(@Param("formId") Long formId);
}
