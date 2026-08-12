package org.example.recrutment.services.formulairesAdaptatifs;

import org.example.recrutment.dto.formulairesAdaptatifs.FieldConditionRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FieldConditionResponseDTO;
import org.example.recrutment.entities.formulairesAdaptatifs.FieldCondition;
import org.example.recrutment.entities.formulairesAdaptatifs.FormField;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.formulairesAdaptatifs.FieldConditionRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormFieldRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

/**
 * Implémentation de FieldConditionService.
 * Avant toute création/modification, vérifie que le champ source ET le champ
 * cible existent bien et appartiennent tous les deux au formulaire (formId)
 * de l'URL -- une condition ne peut jamais relier deux champs de formulaires
 * différents.
 */
@Service
public class FieldConditionServiceImpl implements FieldConditionService {

    private final FieldConditionRepository fieldConditionRepository;
    private final FormFieldRepository formFieldRepository;

    public FieldConditionServiceImpl(FieldConditionRepository fieldConditionRepository,
                                     FormFieldRepository formFieldRepository) {
        this.fieldConditionRepository = fieldConditionRepository;
        this.formFieldRepository = formFieldRepository;
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public FieldConditionResponseDTO create(Long formId, FieldConditionRequestDTO request) {
        validateFieldsAreDistinct(request);

        FormField sourceField = findFieldOrThrow(formId, request.getSourceFieldId());
        FormField targetField = findFieldOrThrow(formId, request.getTargetFieldId());

        FieldCondition condition = FieldCondition.builder()
                .operator(request.getOperator())
                .expectedValue(request.getExpectedValue())
                .action(request.getAction())
                .conditionGroup(request.getConditionGroup())
                .logicalOperator(request.getLogicalOperator())
                .sourceField(sourceField)
                .targetField(targetField)
                .build();

        FieldCondition saved = fieldConditionRepository.save(condition);
        return toResponseDTO(saved);
    }

    // ==================== Read ====================

    @Override
    public FieldConditionResponseDTO getById(Long formId, Long conditionId) {
        FieldCondition condition = findConditionOrThrow(formId, conditionId);
        return toResponseDTO(condition);
    }

    @Override
    public List<FieldConditionResponseDTO> getAllByForm(Long formId) {
        return fieldConditionRepository.findByTargetField_Form_FormId(formId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // ==================== Update ====================

    @Override
    @Transactional
    public FieldConditionResponseDTO update(Long formId, Long conditionId, FieldConditionRequestDTO request) {
        validateFieldsAreDistinct(request);

        FieldCondition condition = findConditionOrThrow(formId, conditionId);
        FormField sourceField = findFieldOrThrow(formId, request.getSourceFieldId());
        FormField targetField = findFieldOrThrow(formId, request.getTargetFieldId());

        condition.setOperator(request.getOperator());
        condition.setExpectedValue(request.getExpectedValue());
        condition.setAction(request.getAction());
        condition.setConditionGroup(request.getConditionGroup());
        condition.setLogicalOperator(request.getLogicalOperator());
        condition.setSourceField(sourceField);
        condition.setTargetField(targetField);

        FieldCondition updated = fieldConditionRepository.save(condition);
        return toResponseDTO(updated);
    }

    // ==================== Delete ====================

    @Override
    @Transactional
    public void delete(Long formId, Long conditionId) {
        FieldCondition condition = findConditionOrThrow(formId, conditionId);
        fieldConditionRepository.delete(condition);
    }

    // ==================== Méthodes utilitaires privées ====================

    /** Une condition ne peut pas relier un champ à lui-même. */
    private void validateFieldsAreDistinct(FieldConditionRequestDTO request) {
        if (request.getSourceFieldId() != null && request.getSourceFieldId().equals(request.getTargetFieldId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le champ source et le champ cible doivent être différents");
        }
    }

    private FormField findFieldOrThrow(Long formId, Long fieldId) {
        return formFieldRepository.findByIdAndForm_FormId(fieldId, formId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Champ introuvable avec l'id : " + fieldId + " pour le formulaire : " + formId));
    }

    private FieldCondition findConditionOrThrow(Long formId, Long conditionId) {
        return fieldConditionRepository.findByIdAndTargetField_Form_FormId(conditionId, formId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Condition introuvable avec l'id : " + conditionId + " pour le formulaire : " + formId));
    }

    private FieldConditionResponseDTO toResponseDTO(FieldCondition condition) {
        return FieldConditionResponseDTO.builder()
                .id(condition.getId())
                .formId(condition.getTargetField().getForm().getFormId())
                .sourceFieldId(condition.getSourceField().getId())
                .sourceFieldLabel(condition.getSourceField().getLabel())
                .targetFieldId(condition.getTargetField().getId())
                .targetFieldLabel(condition.getTargetField().getLabel())
                .operator(condition.getOperator())
                .expectedValue(condition.getExpectedValue())
                .action(condition.getAction())
                .conditionGroup(condition.getConditionGroup())
                .logicalOperator(condition.getLogicalOperator())
                .build();
    }
}