package org.example.recrutment.services.gestionEntretiens;

import org.example.recrutment.dto.gestionEntretiens.InterviewRoomDto;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.gestionEntretiens.InterviewMode;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class InterviewJoinWindowServiceTest {
    private final InterviewJoinWindowService service = new InterviewJoinWindowService(10, 20);

    @Test
    void returnsJoinWindowBoundsForOnlineInterview() {
        Interview interview = Interview.builder()
                .mode(InterviewMode.ONLINE)
                .roomId("room-123")
                .status(InterviewStatus.SCHEDULED)
                .scheduledAt(LocalDateTime.of(2026, 9, 1, 10, 0))
                .durationMinutes(45)
                .build();

        InterviewRoomDto.JoinWindow window = service.joinWindow(interview);

        assertThat(window.startsAt()).isEqualTo(LocalDateTime.of(2026, 9, 1, 9, 50));
        assertThat(window.endsAt()).isEqualTo(LocalDateTime.of(2026, 9, 1, 11, 5));
    }

    @Test
    void doesNotAllowJoinForCancelledInterview() {
        Interview interview = Interview.builder()
                .mode(InterviewMode.ONLINE)
                .roomId("room-123")
                .status(InterviewStatus.CANCELLED)
                .scheduledAt(LocalDateTime.now())
                .durationMinutes(45)
                .build();

        InterviewRoomDto.JoinWindow window = service.joinWindow(interview);

        assertThat(window.available()).isFalse();
        assertThat(service.hasJoinableStatus(interview)).isFalse();
    }
}
