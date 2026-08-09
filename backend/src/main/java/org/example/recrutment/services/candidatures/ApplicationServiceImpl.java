package org.example.recrutment.services.candidatures;

import org.example.recrutment.dto.candidatures.ApplicationRequestDTO;
import org.example.recrutment.dto.candidatures.ApplicationResponseDTO;
import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.candidatures.ApplicationStatus;
import org.example.recrutment.entities.candidatures.FinalDecision;
import org.example.recrutment.entities.candidatures.RecruitmentStage;
import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.users.Candidates;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.example.recrutment.repositories.gestionOffres.JobOfferRepository;
import org.example.recrutment.repositories.users.CandidateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implémentation de ApplicationService.
 * Vérifie l'existence du candidat (candidateId) et de l'offre (jobOfferId)
 * avant toute création/modification. submittedAt est renseigné
 * automatiquement dès que le statut passe à SUBMITTED.
 */
@Service
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final CandidateRepository candidateRepository;
    private final JobOfferRepository jobOfferRepository;

    public ApplicationServiceImpl(ApplicationRepository applicationRepository,
                                  CandidateRepository candidateRepository,
                                  JobOfferRepository jobOfferRepository) {
        this.applicationRepository = applicationRepository;
        this.candidateRepository = candidateRepository;
        this.jobOfferRepository = jobOfferRepository;
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public ApplicationResponseDTO create(ApplicationRequestDTO request) {
        Candidates candidate = findCandidateOrThrow(request.getCandidateId());
        JobOffer jobOffer = findJobOfferOrThrow(request.getJobOfferId());

        ApplicationStatus status = request.getStatus() != null ? request.getStatus() : ApplicationStatus.DRAFT;

        Application application = Application.builder()
                .status(status)
                .currentStage(request.getCurrentStage() != null ? request.getCurrentStage() : RecruitmentStage.SUBMISSION)
                .finalDecision(request.getFinalDecision() != null ? request.getFinalDecision() : FinalDecision.PENDING)
                .rejectionReason(request.getRejectionReason())
                .withdrawalReason(request.getWithdrawalReason())
                .submittedAt(status == ApplicationStatus.SUBMITTED ? LocalDateTime.now() : null)
                .candidate(candidate)
                .jobOffer(jobOffer)
                .build();

        Application saved = applicationRepository.save(application);
        return toResponseDTO(saved);
    }

    // ==================== Read ====================

    @Override
    public ApplicationResponseDTO getById(Long id) {
        return toResponseDTO(findApplicationOrThrow(id));
    }

    @Override
    public List<ApplicationResponseDTO> getAll() {
        return applicationRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Override
    public List<ApplicationResponseDTO> getAllByCandidate(Long candidateId) {
        findCandidateOrThrow(candidateId);
        return applicationRepository.findByCandidate_Id(candidateId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Override
    public List<ApplicationResponseDTO> getAllByJobOffer(Long jobOfferId) {
        findJobOfferOrThrow(jobOfferId);
        return applicationRepository.findByJobOffer_Id(jobOfferId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // ==================== Update ====================

    @Override
    @Transactional
    public ApplicationResponseDTO update(Long id, ApplicationRequestDTO request) {
        Application application = findApplicationOrThrow(id);
        Candidates candidate = findCandidateOrThrow(request.getCandidateId());
        JobOffer jobOffer = findJobOfferOrThrow(request.getJobOfferId());

        boolean becomingSubmitted = request.getStatus() == ApplicationStatus.SUBMITTED
                && application.getStatus() != ApplicationStatus.SUBMITTED;

        if (request.getStatus() != null) {
            application.setStatus(request.getStatus());
        }
        if (request.getCurrentStage() != null) {
            application.setCurrentStage(request.getCurrentStage());
        }
        if (request.getFinalDecision() != null) {
            application.setFinalDecision(request.getFinalDecision());
        }
        application.setRejectionReason(request.getRejectionReason());
        application.setWithdrawalReason(request.getWithdrawalReason());
        if (becomingSubmitted) {
            application.setSubmittedAt(LocalDateTime.now());
        }
        application.setCandidate(candidate);
        application.setJobOffer(jobOffer);

        Application updated = applicationRepository.save(application);
        return toResponseDTO(updated);
    }

    // ==================== Delete ====================

    @Override
    @Transactional
    public void delete(Long id) {
        Application application = findApplicationOrThrow(id);
        applicationRepository.delete(application);
    }

    // ==================== Méthodes utilitaires privées ====================

    private Application findApplicationOrThrow(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature introuvable avec l'id : " + id));
    }

    private Candidates findCandidateOrThrow(Long candidateId) {
        return candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat introuvable avec l'id : " + candidateId));
    }

    private JobOffer findJobOfferOrThrow(Long jobOfferId) {
        return jobOfferRepository.findById(jobOfferId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre introuvable avec l'id : " + jobOfferId));
    }

    private ApplicationResponseDTO toResponseDTO(Application application) {
        return ApplicationResponseDTO.builder()
                .id(application.getId())
                .status(application.getStatus())
                .currentStage(application.getCurrentStage())
                .submittedAt(application.getSubmittedAt())
                .updatedAt(application.getUpdatedAt())
                .finalDecision(application.getFinalDecision())
                .rejectionReason(application.getRejectionReason())
                .withdrawalReason(application.getWithdrawalReason())
                .candidateId(application.getCandidate().getId())
                .jobOfferId(application.getJobOffer().getId())
                .build();
    }
}
