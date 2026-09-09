package org.example.recrutment.services.formulairesAdaptatifs;

import org.example.recrutment.dto.formulairesAdaptatifs.FormRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FormResponseDTO;
import org.example.recrutment.entities.formulairesAdaptatifs.Form;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.candidatures.FieldResponseRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FieldConditionRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FieldOptionRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormFieldRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormRepository;
import org.example.recrutment.repositories.gestionOffres.JobOfferRepository;
import org.example.recrutment.services.liaisons.JobOfferFormService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FormServiceImpl implements FormService {

    private final FormRepository formRepository;
    private final FormFieldRepository formFieldRepository;
    private final FieldConditionRepository fieldConditionRepository;
    private final FieldOptionRepository fieldOptionRepository;
    private final FieldResponseRepository fieldResponseRepository;
    private final JobOfferRepository jobOfferRepository;
    private final JobOfferFormService jobOfferFormService;

    public FormServiceImpl(
            FormRepository formRepository,
            FormFieldRepository formFieldRepository,
            FieldConditionRepository fieldConditionRepository,
            FieldOptionRepository fieldOptionRepository,
            FieldResponseRepository fieldResponseRepository,
            JobOfferRepository jobOfferRepository,
            JobOfferFormService jobOfferFormService
    ) {
        this.formRepository = formRepository;
        this.formFieldRepository = formFieldRepository;
        this.fieldConditionRepository = fieldConditionRepository;
        this.fieldOptionRepository = fieldOptionRepository;
        this.fieldResponseRepository = fieldResponseRepository;
        this.jobOfferRepository = jobOfferRepository;
        this.jobOfferFormService = jobOfferFormService;
    }

    @Override
    @Transactional
    public FormResponseDTO create(FormRequestDTO request) {
        Form form = Form.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .active(
                        request.getActive() != null
                                ? request.getActive()
                                : true
                )
                .build();

        Form saved = formRepository.save(form);

        jobOfferFormService.addLinks(
                saved,
                request.getJobOfferIds()
        );

        return toResponseDTO(saved);
    }

    @Override
    public FormResponseDTO getById(Long id) {
        return toResponseDTO(findFormOrThrow(id));
    }

    @Override
    public List<FormResponseDTO> getAll() {
        return formRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Override
    public List<FormResponseDTO> getAllActive() {
        return formRepository.findByActiveTrue()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Override
    @Transactional
    public FormResponseDTO update(Long id, FormRequestDTO request) {
        Form form = findFormOrThrow(id);

        form.setTitle(request.getTitle());
        form.setDescription(request.getDescription());

        if (request.getActive() != null) {
            form.setActive(request.getActive());
        }

        Form saved = formRepository.save(form);

        jobOfferFormService.addLinks(
                saved,
                request.getJobOfferIds()
        );

        return toResponseDTO(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Form form = findFormOrThrow(id);

        /*
         * Suppression définitive :
         * les réponses candidates associées aux champs seront supprimées.
         */

        // 1. Retire la référence du formulaire depuis les offres.
        jobOfferRepository.clearFormId(id);

        // 2. Supprime les réponses candidates avant les champs.
        fieldResponseRepository.deleteAllByFormId(id);

        // 3. Supprime les conditions des champs.
        fieldConditionRepository.deleteAllByFormId(id);

        // 4. Supprime les options des champs.
        fieldOptionRepository.deleteAllByFormId(id);

        // 5. Supprime les champs.
        formFieldRepository.deleteByForm_FormId(id);

        // 6. Supprime le formulaire.
        formRepository.delete(form);
    }

    private Form findFormOrThrow(Long id) {
        return formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Formulaire introuvable avec l'id : " + id
                ));
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