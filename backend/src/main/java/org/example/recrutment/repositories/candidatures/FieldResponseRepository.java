package org.example.recrutment.repositories.candidatures;

import jakarta.transaction.Transactional;
import org.example.recrutment.entities.candidatures.FieldResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FieldResponseRepository
        extends JpaRepository<FieldResponse, Long> {

    List<FieldResponse> findByApplication_Id(Long applicationId);

    Optional<FieldResponse> findByApplication_IdAndField_Id(
            Long applicationId,
            Long fieldId
    );

    /*
     * Supprime les réponses liées aux candidatures d'une offre.
     * Cette méthode existait déjà dans ton projet : on la conserve.
     */
    @Modifying
    @Transactional
    @Query("""
        DELETE FROM FieldResponse response
        WHERE response.application.jobOffer.id = :offerId
        """)
    void deleteByApplicationJobOfferId(@Param("offerId") Long offerId);

    /*
     * Supprime toutes les réponses des candidats liées aux champs
     * d'un formulaire précis.
     *
     * Ordre indispensable avant :
     * formFieldRepository.deleteByForm_FormId(formId)
     */
    @Modifying
    @Transactional
    @Query("""
        DELETE FROM FieldResponse response
        WHERE response.field.id IN (
            SELECT field.id
            FROM FormField field
            WHERE field.form.formId = :formId
        )
        """)
    void deleteAllByFormId(@Param("formId") Long formId);

    /*
     * Supprime toutes les réponses liées à un seul champ de formulaire.
     *
     * À utiliser avant :
     * formFieldRepository.delete(field)
     */
    @Modifying
    @Transactional
    @Query("""
        DELETE FROM FieldResponse response
        WHERE response.field.id = :fieldId
        """)
    void deleteAllByFieldId(@Param("fieldId") Long fieldId);
}