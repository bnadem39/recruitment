package org.example.recrutment.services.gestionEntretiens;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.recrutment.dto.gestionEntretiens.InterviewSignalMessage;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.users.Users;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.example.recrutment.entities.gestionEntretiens.InterviewMode;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewSignalingService {
    private final InterviewAuthorizationService authorizationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentHashMap<Long, Set<String>> joinedUsers = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public void handle(String email, Long interviewId, InterviewSignalMessage message) {
        Users sender = authorizationService.userByEmail(email);
        Interview interview = authorizationService.requireMediaParticipant(sender, interviewId);
        if (interview.getMode() != InterviewMode.ONLINE || interview.getRoomId() == null
                || (interview.getStatus() != InterviewStatus.SCHEDULED && interview.getStatus() != InterviewStatus.IN_PROGRESS)) {
            throw new IllegalStateException("Interview is not an active online room");
        }
        log.debug("Interview signal {} for interview {}", message.type(), interviewId);
        switch (message.type()) {
            case JOIN -> join(sender, interview);
            case LEAVE -> leave(sender, interview);
            case OFFER, ANSWER, ICE_CANDIDATE -> forward(sender, interview, message);
            case READY -> throw new IllegalArgumentException("READY is a server-only signal");
        }
    }

    private void join(Users sender, Interview interview) {
        Set<String> joined = joinedUsers.computeIfAbsent(interview.getId(), ignored -> ConcurrentHashMap.newKeySet());
        joined.add(sender.getEmail());
        String counterpart = counterpartEmail(sender, interview);
        if (joined.contains(counterpart)) {
            send(sender.getEmail(), interview.getId(), new InterviewSignalMessage(InterviewSignalMessage.SignalType.READY, null));
            send(counterpart, interview.getId(), new InterviewSignalMessage(InterviewSignalMessage.SignalType.READY, null));
        }
    }

    private void leave(Users sender, Interview interview) {
        Set<String> joined = joinedUsers.get(interview.getId());
        if (joined != null) {
            joined.remove(sender.getEmail());
            if (joined.isEmpty()) joinedUsers.remove(interview.getId());
        }
        forward(sender, interview, new InterviewSignalMessage(InterviewSignalMessage.SignalType.LEAVE, null));
    }

    private void forward(Users sender, Interview interview, InterviewSignalMessage message) {
        send(counterpartEmail(sender, interview), interview.getId(), message);
    }

    private String counterpartEmail(Users sender, Interview interview) {
        if (authorizationService.isCandidate(sender, interview)) {
            if (interview.getAssignedEvaluator() == null) throw new IllegalStateException("Interview has no assigned evaluator");
            return interview.getAssignedEvaluator().getEmail();
        }
        return interview.getApplication().getCandidate().getEmail();
    }

    private void send(String email, Long interviewId, InterviewSignalMessage message) {
        messagingTemplate.convertAndSendToUser(email, "/queue/interviews/" + interviewId, message);
    }
}
