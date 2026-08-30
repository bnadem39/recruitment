package org.example.recrutment.services.formulairesAdaptatifs;

import org.example.recrutment.dto.formulairesAdaptatifs.FormRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FormResponseDTO;
import org.example.recrutment.entities.formulairesAdaptatifs.Form;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.formulairesAdaptatifs.FieldConditionRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FieldOptionRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormFieldRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormRepository;
import org.example.recrutment.repositories.gestionOffres.JobOfferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FormServiceImpl implements FormService {

    private final FormRepository formRepository;
    private final FormFieldRepository formFieldRepository;
    private final FieldConditionRepository fieldConditionRepository;
    private final FieldOptionRepository fieldOptionRepository;
    private final JobOfferRepository jobOfferRepository;

    public FormServiceImpl(
            FormRepository formRepository,
            FormFieldRepository formFieldRepository,
            FieldConditionRepository fieldConditionRepository,
            FieldOptionRepository fieldOptionRepository,
            JobOfferRepository jobOfferRepository
    ) {
        this.formRepository = formRepository;
        this.formFieldRepository = formFieldRepository;
        this.fieldConditionRepository = fieldConditionRepository;
        this.fieldOptionRepository = fieldOptionRepository;
        this.jobOfferRepository = jobOfferRepository;
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public FormResponseDTO create(FormRequestDTO request) {
        Form form = Form.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Form saved = formRepository.save(form);
        return toResponseDTO(saved);
    }

    // ==================== Read ====================

    @Override
    public FormResponseDTO getById(Long id) {
        return toResponseDTO(findFormOrThrow(id));
    }

    @Override
    public List<FormResponseDTO> getAll() {
        return formRepository.findAll().stream().map(this::toResponseDTO).toList();
    }

    @Override
    public List<FormResponseDTO> getAllActive() {
        return formRepository.findByActiveTrue().stream().map(this::toResponseDTO).toList();
    }

    // ==================== Update ====================

    @Override
    @Transactional
    public FormResponseDTO update(Long id, FormRequestDTO request) {
        Form form = findFormOrThrow(id);
        form.setTitle(request.getTitle());
        form.setDescription(request.getDescription());
        if (request.getActive() != null) {
            form.setActive(request.getActive());
        }
        return toResponseDTO(formRepository.save(form));
    }

    // ==================== Delete ====================

    @Override
    @Transactional
    public void delete(Long id) {
        Form form = findFormOrThrow(id);

        // 0. Détacher les offres liées (évite FK job_offers.form_id)
        jobOfferRepository.clearFormId(id);

        // 1. Conditions (FK → form_fields)
        fieldConditionRepository.deleteAllByFormId(id);

        // 2. Options (FK → form_fields)
        fieldOptionRepository.deleteAllByFormId(id);

        // 3. Champs
        formFieldRepository.deleteByForm_FormId(id);

        // 4. Formulaire
        formRepository.delete(form);
    }

    // ==================== Utils ====================

    private Form findFormOrThrow(Long id) {
        return formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Formulaire introuvable avec l'id : " + id));
    }

    private FormResponseDTO toResponseDTO(Form form) {
        return FormResponseDTO.builder()
                .id(form.getFormId())
                .title(form.getTitle())
                .description(form.getDescription())
                .active(form.getActive())
                .createdAt(form.getCreatedAt())
                .updatedAt(form.getUpdatedAt())
                .build();
    }
}