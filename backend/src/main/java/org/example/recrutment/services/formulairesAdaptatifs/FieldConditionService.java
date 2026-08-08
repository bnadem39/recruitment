package org.example.recrutment.services.formulairesAdaptatifs;

import org.example.recrutment.dto.formulairesAdaptatifs.FieldConditionRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FieldConditionResponseDTO;

import java.util.List;

/**
 * Contrat des opérations métier sur les règles de logique conditionnelle.
 * Imbriqué sous formId (une condition relie deux champs du même formulaire).
 */
public interface FieldConditionService {

    FieldConditionResponseDTO create(Long formId, FieldConditionRequestDTO request);

    FieldConditionResponseDTO getById(Long formId, Long conditionId);

    List<FieldConditionResponseDTO> getAllByForm(Long formId);

    FieldConditionResponseDTO update(Long formId, Long conditionId, FieldConditionRequestDTO request);

    void delete(Long formId, Long conditionId);
}
