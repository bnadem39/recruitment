package org.example.recrutment.services.formulairesAdaptatifs;

import org.example.recrutment.dto.formulairesAdaptatifs.FieldOptionRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FieldOptionResponseDTO;
import org.example.recrutment.entities.formulairesAdaptatifs.FieldOption;
import org.example.recrutment.entities.formulairesAdaptatifs.FormField;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.formulairesAdaptatifs.FieldOptionRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormFieldRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation de FieldOptionService.
 * Vérifie en cascade : le champ (fieldId) appartient bien au formulaire (formId),
 * puis l'option (optionId) appartient bien au champ -- évite qu'une option
 * soit manipulée via l'URL d'un formulaire/champ qui n'est pas le sien.
 */
@Service
public class FieldOptionServiceImpl implements FieldOptionService {

    private final FieldOptionRepository fieldOptionRepository;
    private final FormFieldRepository formFieldRepository;

    public FieldOptionServiceImpl(FieldOptionRepository fieldOptionRepository, FormFieldRepository formFieldRepository) {
        this.fieldOptionRepository = fieldOptionRepository;
        this.formFieldRepository = formFieldRepository;
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public FieldOptionResponseDTO create(Long formId, Long fieldId, FieldOptionRequestDTO request) {
        FormField field = findFieldOrThrow(formId, fieldId);

        FieldOption option = FieldOption.builder()
                .label(request.getLabel())
                .value(request.getValue())
                .displayOrder(request.getDisplayOrder())
                .formField(field)
                .build();

        FieldOption saved = fieldOptionRepository.save(option);
        return toResponseDTO(saved);
    }

    // ==================== Read ====================

    @Override
    public FieldOptionResponseDTO getById(Long formId, Long fieldId, Long optionId) {
        findFieldOrThrow(formId, fieldId);
        FieldOption option = findOptionOrThrow(fieldId, optionId);
        return toResponseDTO(option);
    }

    @Override
    public List<FieldOptionResponseDTO> getAllByField(Long formId, Long fieldId) {
        findFieldOrThrow(formId, fieldId);
        return fieldOptionRepository.findByFormField_IdOrderByDisplayOrderAsc(fieldId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // ==================== Update ====================

    @Override
    @Transactional
    public FieldOptionResponseDTO update(Long formId, Long fieldId, Long optionId, FieldOptionRequestDTO request) {
        findFieldOrThrow(formId, fieldId);
        FieldOption option = findOptionOrThrow(fieldId, optionId);

        option.setLabel(request.getLabel());
        option.setValue(request.getValue());
        option.setDisplayOrder(request.getDisplayOrder());

        FieldOption updated = fieldOptionRepository.save(option);
        return toResponseDTO(updated);
    }

    // ==================== Delete ====================

    @Override
    @Transactional
    public void delete(Long formId, Long fieldId, Long optionId) {
        findFieldOrThrow(formId, fieldId);
        FieldOption option = findOptionOrThrow(fieldId, optionId);
        fieldOptionRepository.delete(option);
    }

    // ==================== Méthodes utilitaires privées ====================

    private FormField findFieldOrThrow(Long formId, Long fieldId) {
        return formFieldRepository.findByIdAndForm_FormId(fieldId, formId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Champ introuvable avec l'id : " + fieldId + " pour le formulaire : " + formId));
    }

    private FieldOption findOptionOrThrow(Long fieldId, Long optionId) {
        return fieldOptionRepository.findByIdAndFormField_Id(optionId, fieldId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Option introuvable avec l'id : " + optionId + " pour le champ : " + fieldId));
    }

    private FieldOptionResponseDTO toResponseDTO(FieldOption option) {
        return FieldOptionResponseDTO.builder()
                .id(option.getId())
                .fieldId(option.getFormField().getId())
                .label(option.getLabel())
                .value(option.getValue())
                .displayOrder(option.getDisplayOrder())
                .build();
    }
}
