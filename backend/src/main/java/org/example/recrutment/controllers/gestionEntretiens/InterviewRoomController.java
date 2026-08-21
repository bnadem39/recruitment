package org.example.recrutment.controllers.gestionEntretiens;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.dto.gestionEntretiens.InterviewRoomDto;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.gestionEntretiens.InterviewMode;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.example.recrutment.services.gestionEntretiens.InterviewAuthorizationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/interview-rooms")
@RequiredArgsConstructor
public class InterviewRoomController {
    private final InterviewRepository interviewRepository;
    private final InterviewAuthorizationService authorizationService;

    @Value("${webrtc.stun-urls:stun:stun.l.google.com:19302}") private String stunUrls;
    @Value("${webrtc.turn-url:}") private String turnUrl;
    @Value("${webrtc.turn-username:}") private String turnUsername;
    @Value("${webrtc.turn-credential:}") private String turnCredential;
    @Value("${webrtc.join-window-before-minutes:30}") private long joinBeforeMinutes;
    @Value("${webrtc.join-window-after-minutes:60}") private long joinAfterMinutes;

    @GetMapping("/my")
    public List<InterviewRoomDto> mine(@AuthenticationPrincipal Users user) {
        List<Interview> interviews = switch (user.getUserRole()) {
            case CANDIDATE -> interviewRepository.findByApplication_Candidate_Id(user.getId());
            case EVALUATOR -> interviewRepository.findByAssignedEvaluator_Id(user.getId());
            case ADMIN, HR -> interviewRepository.findAll();
        };
        return interviews.stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public InterviewRoomDto get(@AuthenticationPrincipal Users user, @PathVariable Long id) {
        return toDto(authorizationService.requireViewAccess(user, id));
    }

    @PostMapping("/{id}/join")
    public InterviewRoomDto.JoinResponse join(@AuthenticationPrincipal Users user, @PathVariable Long id) {
        Interview interview = authorizationService.requireMediaParticipant(user, id);
        validateJoin(interview);
        List<InterviewRoomDto.IceServer> servers = new ArrayList<>();
        List<String> stuns = Arrays.stream(stunUrls.split(",")).map(String::trim).filter(value -> !value.isBlank()).toList();
        if (!stuns.isEmpty()) servers.add(new InterviewRoomDto.IceServer(stuns, null, null));
        if (!turnUrl.isBlank()) servers.add(new InterviewRoomDto.IceServer(List.of(turnUrl), turnUsername, turnCredential));
        return new InterviewRoomDto.JoinResponse(interview.getId(), interview.getRoomId(),
                user.getUserRole() == UserRole.CANDIDATE ? "CANDIDATE" : "EVALUATOR", servers);
    }

    private void validateJoin(Interview interview) {
        if (interview.getMode() != InterviewMode.ONLINE || interview.getRoomId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interview is not an online room");
        }
        if (interview.getStatus() != InterviewStatus.SCHEDULED && interview.getStatus() != InterviewStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Interview is not joinable in its current status");
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime earliest = interview.getScheduledAt().minusMinutes(joinBeforeMinutes);
        LocalDateTime latest = interview.getScheduledAt().plusMinutes(
                (interview.getDurationMinutes() == null ? 60 : interview.getDurationMinutes()) + joinAfterMinutes);
        if (now.isBefore(earliest) || now.isAfter(latest)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Interview room is outside its join window");
        }
    }

    private InterviewRoomDto toDto(Interview interview) {
        boolean joinable = interview.getMode() == InterviewMode.ONLINE
                && (interview.getStatus() == InterviewStatus.SCHEDULED || interview.getStatus() == InterviewStatus.IN_PROGRESS);
        return new InterviewRoomDto(interview.getId(), interview.getApplication().getJobOffer().getTitle(),
                interview.getInterviewType(), interview.getMode(), interview.getStatus(), interview.getScheduledAt(),
                interview.getDurationMinutes(), joinable, interview.getApplication().getId(),
                interview.getApplication().getCandidate().getFirstName() + " "
                        + interview.getApplication().getCandidate().getLastName(),
                interview.getLocation(), interview.getEvaluation() != null ? interview.getEvaluation().getId() : null);
    }
}
