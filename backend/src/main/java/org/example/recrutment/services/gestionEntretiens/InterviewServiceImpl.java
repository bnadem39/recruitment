package org.example.recrutment.services.gestionEntretiens;

import org.example.recrutment.dto.gestionEntretiens.InterviewRequestDTO;
import org.example.recrutment.dto.gestionEntretiens.InterviewResponseDTO;
import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.example.recrutment.entities.gestionEntretiens.InterviewMode;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.users.UserRepository;
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
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public InterviewServiceImpl(InterviewRepository interviewRepository, ApplicationRepository applicationRepository,
                                NotificationService notificationService, UserRepository userRepository) {
        this.interviewRepository = interviewRepository;
        this.applicationRepository = applicationRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public InterviewResponseDTO create(InterviewRequestDTO request) {
        Application application = findApplicationOrThrow(request.getApplicationId());
        Users evaluator = findEvaluator(request.getAssignedEvaluatorId());
        InterviewMode mode = request.getMode() != null ? request.getMode() : InterviewMode.ONSITE;

        Interview interview = Interview.builder()
                .interviewType(request.getInterviewType())
                .scheduledAt(request.getScheduledAt())
                .durationMinutes(request.getDurationMinutes())
                .location(request.getLocation())
                .meetingLink(request.getMeetingLink())
                .mode(mode)
                .roomId(mode == InterviewMode.ONLINE ? java.util.UUID.randomUUID().toString() : null)
                .assignedEvaluator(evaluator)
                .status(request.getStatus() != null ? request.getStatus() : InterviewStatus.SCHEDULED)
                .notes(request.getNotes())
                .application(application)
                .build();

        Interview saved = interviewRepository.save(interview);
        notificationService.notify(application.getCandidate(), "Interview scheduled",
                "An interview has been scheduled for your application to " + application.getJobOffer().getTitle() + ".",
                "INTERVIEW_SCHEDULED", "/interviews/" + saved.getId());
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
        var previousSchedule = interview.getScheduledAt();
        var previousStatus = interview.getStatus();
        Application application = findApplicationOrThrow(request.getApplicationId());

        interview.setInterviewType(request.getInterviewType());
        interview.setScheduledAt(request.getScheduledAt());
        interview.setDurationMinutes(request.getDurationMinutes());
        interview.setLocation(request.getLocation());
        interview.setMeetingLink(request.getMeetingLink());
        InterviewMode mode = request.getMode() != null ? request.getMode() : InterviewMode.ONSITE;
        interview.setMode(mode);
        if (mode == InterviewMode.ONLINE && interview.getRoomId() == null) {
            interview.setRoomId(java.util.UUID.randomUUID().toString());
        }
        if (mode == InterviewMode.ONSITE) interview.setRoomId(null);
        interview.setAssignedEvaluator(findEvaluator(request.getAssignedEvaluatorId()));
        if (request.getStatus() != null) {
            interview.setStatus(request.getStatus());
        }
        interview.setNotes(request.getNotes());
        interview.setApplication(application);

        Interview updated = interviewRepository.save(interview);
        if (!java.util.Objects.equals(previousSchedule, updated.getScheduledAt()) || previousStatus != updated.getStatus()) {
            notificationService.notify(application.getCandidate(), "Interview updated",
                    "Your interview for " + application.getJobOffer().getTitle() + " has been updated.",
                    "INTERVIEW_UPDATED", "/interviews/" + updated.getId());
        }
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
                .mode(interview.getMode())
                .assignedEvaluatorId(interview.getAssignedEvaluator() != null ? interview.getAssignedEvaluator().getId() : null)
                .status(interview.getStatus())
                .notes(interview.getNotes())
                .applicationId(interview.getApplication().getId())
                .evaluationId(interview.getEvaluation() != null ? interview.getEvaluation().getId() : null)
                .createdAt(interview.getCreatedAt())
                .build();
    }

    private Users findEvaluator(Long evaluatorId) {
        if (evaluatorId == null) return null;
        Users evaluator = userRepository.findById(evaluatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluator not found: " + evaluatorId));
        if (evaluator.getUserRole() != UserRole.EVALUATOR) {
            throw new IllegalArgumentException("Assigned interview participant must have the EVALUATOR role");
        }
        return evaluator;
    }
}
