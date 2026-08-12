package org.example.recrutment.services.gestionOffres;

import org.example.recrutment.dto.gestionOffres.JobOfferRequestDTO;
import org.example.recrutment.dto.gestionOffres.JobOfferResponseDTO;
import org.example.recrutment.entities.formulairesAdaptatifs.Form;
import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.gestionOffres.OfferStatus;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormRepository;
import org.example.recrutment.repositories.gestionOffres.JobOfferRepository;
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

    public JobOfferServiceImpl(JobOfferRepository jobOfferRepository, FormRepository formRepository) {
        this.jobOfferRepository = jobOfferRepository;
        this.formRepository = formRepository;
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public JobOfferResponseDTO create(JobOfferRequestDTO request) {
        Form form = findFormOrThrow(request.getFormId());

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
        Form form = findFormOrThrow(request.getFormId());

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
                .formId(offer.getForm().getFormId())
                .openForApplications(offer.isOpenForApplications())
                .createdAt(offer.getCreatedAt())
                .updatedAt(offer.getUpdatedAt())
                .build();
    }
}
