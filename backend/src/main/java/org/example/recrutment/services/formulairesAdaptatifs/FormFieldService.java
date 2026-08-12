package org.example.recrutment.services.formulairesAdaptatifs;

import org.example.recrutment.dto.formulairesAdaptatifs.FormFieldRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FormFieldResponseDTO;

import java.util.List;

/**
 * Contrat des opérations métier sur les champs d'un formulaire.
 * Toutes les méthodes prennent formId en paramètre car un FormField
 * n'a de sens que dans le contexte de son formulaire parent.
 */
public interface FormFieldService {

    FormFieldResponseDTO create(Long formId, FormFieldRequestDTO request);

    FormFieldResponseDTO getById(Long formId, Long fieldId);

    List<FormFieldResponseDTO> getAllByForm(Long formId);

    FormFieldResponseDTO update(Long formId, Long fieldId, FormFieldRequestDTO request);

    void delete(Long formId, Long fieldId);
}
