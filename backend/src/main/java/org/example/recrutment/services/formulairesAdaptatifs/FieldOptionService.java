package org.example.recrutment.services.formulairesAdaptatifs;

import org.example.recrutment.dto.formulairesAdaptatifs.FieldOptionRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FieldOptionResponseDTO;

import java.util.List;

/**
 * Contrat des opérations métier sur les options d'un champ.
 * Chaque méthode prend formId ET fieldId car une option n'a de sens
 * que dans le contexte de son champ, lui-même rattaché à un formulaire.
 */
public interface FieldOptionService {

    FieldOptionResponseDTO create(Long formId, Long fieldId, FieldOptionRequestDTO request);

    FieldOptionResponseDTO getById(Long formId, Long fieldId, Long optionId);

    List<FieldOptionResponseDTO> getAllByField(Long formId, Long fieldId);

    FieldOptionResponseDTO update(Long formId, Long fieldId, Long optionId, FieldOptionRequestDTO request);

    void delete(Long formId, Long fieldId, Long optionId);
}
