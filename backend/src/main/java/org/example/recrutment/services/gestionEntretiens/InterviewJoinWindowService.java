package org.example.recrutment.services.gestionEntretiens;

import org.example.recrutment.dto.gestionEntretiens.InterviewRoomDto;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.gestionEntretiens.InterviewMode;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class InterviewJoinWindowService {
    private final long joinBeforeMinutes;
    private final long joinAfterMinutes;

    public InterviewJoinWindowService(
            @Value("${webrtc.join-window-before-minutes:30}") long joinBeforeMinutes,
            @Value("${webrtc.join-window-after-minutes:60}") long joinAfterMinutes) {
        this.joinBeforeMinutes = joinBeforeMinutes;
        this.joinAfterMinutes = joinAfterMinutes;
    }

    public InterviewRoomDto.JoinWindow joinWindow(Interview interview) {
        if (interview.getScheduledAt() == null) {
            return new InterviewRoomDto.JoinWindow(null, null, false);
        }
        LocalDateTime opensAt = interview.getScheduledAt().minusMinutes(joinBeforeMinutes);
        LocalDateTime closesAt = interview.getScheduledAt().plusMinutes(defaultDuration(interview) + joinAfterMinutes);
        boolean joinAvailable = supportsOnlineRoom(interview)
                && hasJoinableStatus(interview)
                && isWithinWindow(LocalDateTime.now(), opensAt, closesAt);
        return new InterviewRoomDto.JoinWindow(opensAt, closesAt, joinAvailable);
    }

    public boolean supportsOnlineRoom(Interview interview) {
        return interview.getMode() == InterviewMode.ONLINE && interview.getRoomId() != null;
    }

    public boolean hasJoinableStatus(Interview interview) {
        return interview.getStatus() == InterviewStatus.SCHEDULED || interview.getStatus() == InterviewStatus.IN_PROGRESS;
    }

    public boolean isWithinWindow(LocalDateTime now, LocalDateTime opensAt, LocalDateTime closesAt) {
        return now != null && opensAt != null && closesAt != null && !now.isBefore(opensAt) && !now.isAfter(closesAt);
    }

    private long defaultDuration(Interview interview) {
        return interview.getDurationMinutes() == null ? 60L : interview.getDurationMinutes();
    }
}
