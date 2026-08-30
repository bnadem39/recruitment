package org.example.recrutment.services.formulairesAdaptatifs;

import org.example.recrutment.dto.formulairesAdaptatifs.FormFieldRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FormFieldResponseDTO;
import org.example.recrutment.entities.formulairesAdaptatifs.Form;
import org.example.recrutment.entities.formulairesAdaptatifs.FormField;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.formulairesAdaptatifs.FieldConditionRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FieldOptionRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormFieldRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FormFieldServiceImpl implements FormFieldService {

    private final FormFieldRepository formFieldRepository;
    private final FormRepository formRepository;
    private final FieldConditionRepository fieldConditionRepository;
    private final FieldOptionRepository fieldOptionRepository;

    public FormFieldServiceImpl(
            FormFieldRepository formFieldRepository,
            FormRepository formRepository,
            FieldConditionRepository fieldConditionRepository,
            FieldOptionRepository fieldOptionRepository
    ) {
        this.formFieldRepository = formFieldRepository;
        this.formRepository = formRepository;
        this.fieldConditionRepository = fieldConditionRepository;
        this.fieldOptionRepository = fieldOptionRepository;
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public FormFieldResponseDTO create(Long formId, FormFieldRequestDTO request) {
        Form form = findFormOrThrow(formId);

        FormField field = FormField.builder()
                .label(request.getLabel())
                .fieldType(request.getFieldType())
                .required(request.getRequired() != null ? request.getRequired() : false)
                .placeholder(request.getPlaceholder())
                .defaultVisible(request.getDefaultVisible() != null ? request.getDefaultVisible() : true)
                .displayOrder(request.getDisplayOrder())
                .validationRule(request.getValidationRule())
                .minimumValue(request.getMinimumValue())
                .maximumValue(request.getMaximumValue())
                .minimumLength(request.getMinimumLength())
                .maximumLength(request.getMaximumLength())
                .form(form)
                .build();

        FormField saved = formFieldRepository.save(field);
        return toResponseDTO(saved);
    }

    // ==================== Read ====================

    @Override
    public FormFieldResponseDTO getById(Long formId, Long fieldId) {
        return toResponseDTO(findFieldOrThrow(formId, fieldId));
    }

    @Override
    public List<FormFieldResponseDTO> getAllByForm(Long formId) {
        findFormOrThrow(formId);
        return formFieldRepository.findByForm_FormIdOrderByDisplayOrderAsc(formId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // ==================== Update ====================

    @Override
    @Transactional
    public FormFieldResponseDTO update(Long formId, Long fieldId, FormFieldRequestDTO request) {
        FormField field = findFieldOrThrow(formId, fieldId);

        field.setLabel(request.getLabel());
        field.setFieldType(request.getFieldType());
        if (request.getRequired() != null) {
            field.setRequired(request.getRequired());
        }
        field.setPlaceholder(request.getPlaceholder());
        if (request.getDefaultVisible() != null) {
            field.setDefaultVisible(request.getDefaultVisible());
        }
        field.setDisplayOrder(request.getDisplayOrder());
        field.setValidationRule(request.getValidationRule());
        field.setMinimumValue(request.getMinimumValue());
        field.setMaximumValue(request.getMaximumValue());
        field.setMinimumLength(request.getMinimumLength());
        field.setMaximumLength(request.getMaximumLength());

        return toResponseDTO(formFieldRepository.save(field));
    }

    // ==================== Delete ====================

    @Override
    @Transactional
    public void delete(Long formId, Long fieldId) {
        FormField field = findFieldOrThrow(formId, fieldId);

        // 1. Conditions
        fieldConditionRepository.deleteAllByFieldId(fieldId);

        // 2. Options
        fieldOptionRepository.deleteAllByFieldId(fieldId);

        // 3. Champ
        formFieldRepository.delete(field);
    }

    // ==================== Utils ====================

    private Form findFormOrThrow(Long formId) {
        return formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Formulaire introuvable avec l'id : " + formId));
    }

    private FormField findFieldOrThrow(Long formId, Long fieldId) {
        return formFieldRepository.findByIdAndForm_FormId(fieldId, formId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Champ introuvable avec l'id : " + fieldId + " pour le formulaire : " + formId));
    }

    private FormFieldResponseDTO toResponseDTO(FormField field) {
        return FormFieldResponseDTO.builder()
                .id(field.getId())
                .formId(field.getForm().getFormId())
                .label(field.getLabel())
                .fieldType(field.getFieldType())
                .required(field.getRequired())
                .placeholder(field.getPlaceholder())
                .defaultVisible(field.getDefaultVisible())
                .displayOrder(field.getDisplayOrder())
                .validationRule(field.getValidationRule())
                .minimumValue(field.getMinimumValue())
                .maximumValue(field.getMaximumValue())
                .minimumLength(field.getMinimumLength())
                .maximumLength(field.getMaximumLength())
                .build();
    }
}