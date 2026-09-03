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

    /*
     * Conservé temporairement parce que ton code de suppression
     * utilise encore job_offers.form_id.
     *
     * Tu pourras le retirer après avoir totalement migré vers
     * job_offer_forms et supprimé job_offers.form_id.
     */
    private final JobOfferRepository jobOfferRepository;

    /*
     * Nouveau service : crée les lignes dans job_offer_forms.
     */
    private final JobOfferFormService jobOfferFormService;

    public FormServiceImpl(
            FormRepository formRepository,
            FormFieldRepository formFieldRepository,
            FieldConditionRepository fieldConditionRepository,
            FieldOptionRepository fieldOptionRepository,
            JobOfferRepository jobOfferRepository,
            JobOfferFormService jobOfferFormService
    ) {
        this.formRepository = formRepository;
        this.formFieldRepository = formFieldRepository;
        this.fieldConditionRepository = fieldConditionRepository;
        this.fieldOptionRepository = fieldOptionRepository;
        this.jobOfferRepository = jobOfferRepository;
        this.jobOfferFormService = jobOfferFormService;
    }

    // ==================== Create ====================

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

        /*
         * Si le frontend envoie :
         * "jobOfferIds": [3, 4]
         *
         * alors le backend ajoute :
         * (job_offer_id = 3, form_id = saved.formId)
         * (job_offer_id = 4, form_id = saved.formId)
         */
        jobOfferFormService.addLinks(
                saved,
                request.getJobOfferIds()
        );

        return toResponseDTO(saved);
    }

    // ==================== Read ====================

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

    // ==================== Update ====================

    @Override
    @Transactional
    public FormResponseDTO update(
            Long id,
            FormRequestDTO request
    ) {
        Form form = findFormOrThrow(id);

        form.setTitle(request.getTitle());
        form.setDescription(request.getDescription());

        if (request.getActive() != null) {
            form.setActive(request.getActive());
        }

        Form saved = formRepository.save(form);

        /*
         * Ajoute les nouvelles offres sélectionnées dans le frontend.
         *
         * La méthode addLinks() utilise existsById(), donc :
         * - un lien existant n'est pas dupliqué ;
         * - les liens anciens ne sont pas supprimés ;
         * - plusieurs offres peuvent être ajoutées au même formulaire.
         */
        jobOfferFormService.addLinks(
                saved,
                request.getJobOfferIds()
        );

        return toResponseDTO(saved);
    }

    // ==================== Delete ====================

    @Override
    @Transactional
    public void delete(Long id) {
        Form form = findFormOrThrow(id);

        /*
         * Temporaire : ancien modèle, job_offers.form_id.
         *
         * Laisse cette ligne uniquement tant que la colonne
         * job_offers.form_id existe encore dans PostgreSQL.
         */
        jobOfferRepository.clearFormId(id);

        /*
         * Les liens dans job_offer_forms seront normalement supprimés
         * automatiquement par la contrainte FK avec ON DELETE CASCADE.
         *
         * Si ta table job_offer_forms n'a pas ON DELETE CASCADE,
         * nous ajouterons une suppression explicite plus tard.
         */

        // 1. Conditions liées aux champs du formulaire.
        fieldConditionRepository.deleteAllByFormId(id);

        // 2. Options liées aux champs du formulaire.
        fieldOptionRepository.deleteAllByFormId(id);

        // 3. Champs du formulaire.
        formFieldRepository.deleteByForm_FormId(id);

        // 4. Formulaire.
        formRepository.delete(form);
    }

    // ==================== Utils ====================

    private Form findFormOrThrow(Long id) {
        return formRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Formulaire introuvable avec l'id : " + id
                        )
                );
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