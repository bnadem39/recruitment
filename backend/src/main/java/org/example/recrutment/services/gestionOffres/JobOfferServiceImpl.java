package org.example.recrutment.services.gestionOffres;

import org.example.recrutment.dto.gestionOffres.JobOfferRequestDTO;
import org.example.recrutment.dto.gestionOffres.JobOfferResponseDTO;
import org.example.recrutment.entities.formulairesAdaptatifs.Form;
import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.gestionOffres.OfferStatus;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormRepository;
import org.example.recrutment.repositories.gestionOffres.JobOfferRepository;
import org.example.recrutment.hr.EvaluatorAssignmentRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation de JobOfferService.
 * Dépend de FormRepository pour vérifier que le formulaire référencé (formId)
 * existe bien avant de créer/modifier une offre -- une offre ne peut pas
 * pointer vers un formulaire inexistant.
 */
@Service
public class JobOfferServiceImpl implements JobOfferService {

    private final JobOfferRepository jobOfferRepository;
    private final FormRepository formRepository;
    private final EvaluatorAssignmentRepository evaluatorAssignments;
    private final NotificationService notifications;

    public JobOfferServiceImpl(JobOfferRepository jobOfferRepository, FormRepository formRepository,
                               EvaluatorAssignmentRepository evaluatorAssignments,
                               NotificationService notifications) {
        this.jobOfferRepository = jobOfferRepository;
        this.formRepository = formRepository;
        this.evaluatorAssignments = evaluatorAssignments;
        this.notifications = notifications;
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public JobOfferResponseDTO create(JobOfferRequestDTO request) {
        Form form = resolveForm(request.getFormId());

        JobOffer offer = JobOffer.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .department(request.getDepartment())
                .contractType(request.getContractType())
                .location(request.getLocation())
                .numberOfPositions(request.getNumberOfPositions() != null ? request.getNumberOfPositions() : 1)
                .publicationDate(request.getPublicationDate())
                .deadline(request.getDeadline())
                .status(request.getStatus() != null ? request.getStatus() : OfferStatus.DRAFT)
                .form(form)
                .build();

        JobOffer saved = jobOfferRepository.save(offer);
        return toResponseDTO(saved);
    }

    // ==================== Read ====================

    @Override
    public JobOfferResponseDTO getById(Long id) {
        return toResponseDTO(findOfferOrThrow(id));
    }

    @Override
    public List<JobOfferResponseDTO> getAll() {
        return jobOfferRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Override
    public List<JobOfferResponseDTO> getAllByStatus(OfferStatus status) {
        return jobOfferRepository.findByStatus(status)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // ==================== Update ====================

    @Override
    @Transactional
    public JobOfferResponseDTO update(Long id, JobOfferRequestDTO request) {
        JobOffer offer = findOfferOrThrow(id);
        Form form = resolveForm(request.getFormId());

        offer.setTitle(request.getTitle());
        offer.setDescription(request.getDescription());
        offer.setDepartment(request.getDepartment());
        offer.setContractType(request.getContractType());
        offer.setLocation(request.getLocation());
        if (request.getNumberOfPositions() != null) {
            offer.setNumberOfPositions(request.getNumberOfPositions());
        }
        offer.setPublicationDate(request.getPublicationDate());
        offer.setDeadline(request.getDeadline());
        if (request.getStatus() != null) {
            offer.setStatus(request.getStatus());
        }
        offer.setForm(form);

        JobOffer updated = jobOfferRepository.save(offer);
        return toResponseDTO(updated);
    }

    @Override
    @Transactional
    public JobOfferResponseDTO publish(Long id) {
        JobOffer offer = findOfferOrThrow(id);
        boolean newlyPublished = offer.getStatus() != OfferStatus.PUBLISHED;
        offer.setStatus(OfferStatus.PUBLISHED);
        if (offer.getPublicationDate() == null) {
            offer.setPublicationDate(java.time.LocalDate.now());
        }
        JobOffer published = jobOfferRepository.save(offer);
        if (newlyPublished) {
            evaluatorAssignments.findByOfferIdWithEvaluator(published.getId()).forEach(assignment ->
                    notifications.notify(assignment.getEvaluator(), "New recruitment offer",
                            "A new job offer is now visible and candidates can submit applications.",
                            "JOB_OFFER_PUBLISHED", "/evaluator/offers/" + published.getId()));
        }
        return toResponseDTO(published);
    }

    @Override
    @Transactional
    public JobOfferResponseDTO hide(Long id) {
        JobOffer offer = findOfferOrThrow(id);
        offer.setStatus(OfferStatus.DRAFT);
        return toResponseDTO(jobOfferRepository.save(offer));
    }

    // ==================== Delete ====================

    @Override
    @Transactional
    public void delete(Long id) {
        JobOffer offer = findOfferOrThrow(id);
        jobOfferRepository.delete(offer);
    }

    // ==================== Méthodes utilitaires privées ====================

    private JobOffer findOfferOrThrow(Long id) {
        return jobOfferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offre introuvable avec l'id : " + id));
    }

    private Form findFormOrThrow(Long formId) {
        return formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Formulaire introuvable avec l'id : " + formId));
    }

    private Form resolveForm(Long formId) {
        if (formId == null) {
            return null;
        }
        return findFormOrThrow(formId);
    }

    private JobOfferResponseDTO toResponseDTO(JobOffer offer) {
        return JobOfferResponseDTO.builder()
                .id(offer.getId())
                .title(offer.getTitle())
                .description(offer.getDescription())
                .department(offer.getDepartment())
                .contractType(offer.getContractType())
                .location(offer.getLocation())
                .numberOfPositions(offer.getNumberOfPositions())
                .publicationDate(offer.getPublicationDate())
                .deadline(offer.getDeadline())
                .status(offer.getStatus())
                .formId(offer.getForm() != null ? offer.getForm().getFormId() : null)
                .openForApplications(offer.isOpenForApplications())
                .createdAt(offer.getCreatedAt())
                .updatedAt(offer.getUpdatedAt())
                .build();
    }
}
