package org.example.recrutment.services.gestionEntretiens;

import org.example.recrutment.dto.gestionEntretiens.InterviewRequestDTO;
import org.example.recrutment.dto.gestionEntretiens.InterviewResponseDTO;
import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation de InterviewService.
 * Dépend de ApplicationRepository pour vérifier que la candidature référencée
 * (applicationId) existe bien avant de créer/modifier un entretien dessus.
 */
@Service
public class InterviewServiceImpl implements InterviewService {

    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;

    public InterviewServiceImpl(InterviewRepository interviewRepository, ApplicationRepository applicationRepository) {
        this.interviewRepository = interviewRepository;
        this.applicationRepository = applicationRepository;
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public InterviewResponseDTO create(InterviewRequestDTO request) {
        Application application = findApplicationOrThrow(request.getApplicationId());

        Interview interview = Interview.builder()
                .interviewType(request.getInterviewType())
                .scheduledAt(request.getScheduledAt())
                .durationMinutes(request.getDurationMinutes())
                .location(request.getLocation())
                .meetingLink(request.getMeetingLink())
                .status(request.getStatus() != null ? request.getStatus() : InterviewStatus.SCHEDULED)
                .notes(request.getNotes())
                .application(application)
                .build();

        Interview saved = interviewRepository.save(interview);
        return toResponseDTO(saved);
    }

    // ==================== Read ====================

    @Override
    public InterviewResponseDTO getById(Long id) {
        return toResponseDTO(findInterviewOrThrow(id));
    }

    @Override
    public List<InterviewResponseDTO> getAll() {
        return interviewRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Override
    public List<InterviewResponseDTO> getAllByApplication(Long applicationId) {
        findApplicationOrThrow(applicationId);
        return interviewRepository.findByApplication_Id(applicationId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // ==================== Update ====================

    @Override
    @Transactional
    public InterviewResponseDTO update(Long id, InterviewRequestDTO request) {
        Interview interview = findInterviewOrThrow(id);
        Application application = findApplicationOrThrow(request.getApplicationId());

        interview.setInterviewType(request.getInterviewType());
        interview.setScheduledAt(request.getScheduledAt());
        interview.setDurationMinutes(request.getDurationMinutes());
        interview.setLocation(request.getLocation());
        interview.setMeetingLink(request.getMeetingLink());
        if (request.getStatus() != null) {
            interview.setStatus(request.getStatus());
        }
        interview.setNotes(request.getNotes());
        interview.setApplication(application);

        Interview updated = interviewRepository.save(interview);
        return toResponseDTO(updated);
    }

    // ==================== Delete ====================

    @Override
    @Transactional
    public void delete(Long id) {
        Interview interview = findInterviewOrThrow(id);
        interviewRepository.delete(interview);
    }

    // ==================== Méthodes utilitaires privées ====================

    private Interview findInterviewOrThrow(Long id) {
        return interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entretien introuvable avec l'id : " + id));
    }

    private Application findApplicationOrThrow(Long applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature introuvable avec l'id : " + applicationId));
    }

    private InterviewResponseDTO toResponseDTO(Interview interview) {
        return InterviewResponseDTO.builder()
                .id(interview.getId())
                .interviewType(interview.getInterviewType())
                .scheduledAt(interview.getScheduledAt())
                .durationMinutes(interview.getDurationMinutes())
                .location(interview.getLocation())
                .meetingLink(interview.getMeetingLink())
                .status(interview.getStatus())
                .notes(interview.getNotes())
                .applicationId(interview.getApplication().getId())
                .evaluationId(interview.getEvaluation() != null ? interview.getEvaluation().getId() : null)
                .createdAt(interview.getCreatedAt())
                .build();
    }
}