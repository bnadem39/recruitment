package org.example.recrutment.dto.gestionEntretiens;

import org.example.recrutment.entities.gestionEntretiens.InterviewMode;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;
import org.example.recrutment.entities.gestionEntretiens.InterviewType;

import java.time.LocalDateTime;
import java.util.List;

public record InterviewRoomDto(Long id, String jobTitle, InterviewType interviewType, InterviewMode mode,
                               InterviewStatus status, LocalDateTime scheduledAt, Integer durationMinutes,
                               boolean joinAvailable, LocalDateTime joinWindowStartsAt,
                               LocalDateTime joinWindowEndsAt, Long applicationId, String candidateName,
                               String location, Long evaluationId) {
    public record JoinResponse(Long interviewId, String roomId, String role, List<IceServer> iceServers) {}
    public record IceServer(List<String> urls, String username, String credential) {}
    public record JoinWindow(LocalDateTime startsAt, LocalDateTime endsAt, boolean available) {}
}
