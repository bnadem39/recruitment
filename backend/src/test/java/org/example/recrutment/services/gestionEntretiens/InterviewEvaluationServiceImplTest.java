package org.example.recrutment.services.gestionEntretiens;

import org.example.recrutment.dto.gestionEntretiens.InterviewEvaluationRequestDTO;
import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.gestionEntretiens.Recommendation;
import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.users.Candidates;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InterviewEvaluationServiceImplTest {

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private NotificationService notificationService;

    @Test
    void createStoresBothCommentsAndNotifiesCandidate() {
        Candidates candidate = Candidates.builder().id(22L).email("candidate@example.com").build();
        JobOffer offer = JobOffer.builder().title("Java Developer").build();
        Application application = Application.builder().candidate(candidate).jobOffer(offer).build();
        Interview interview = Interview.builder().id(7L).application(application).build();
        InterviewEvaluationRequestDTO request = InterviewEvaluationRequestDTO.builder()
                .technicalScore(new BigDecimal("16"))
                .communicationScore(new BigDecimal("15"))
                .motivationScore(new BigDecimal("17"))
                .professionalismScore(new BigDecimal("16"))
                .overallScore(new BigDecimal("16"))
                .recommendation(Recommendation.FAVORABLE)
                .hrComment("Strong technical evidence for HR")
                .candidateComment("Clear reasoning and a strong interview")
                .build();
        when(interviewRepository.findById(7L)).thenReturn(Optional.of(interview));
        when(interviewRepository.save(interview)).thenReturn(interview);

        var result = new InterviewEvaluationServiceImpl(interviewRepository, notificationService)
                .create(7L, request);

        assertThat(result.getHrComment()).isEqualTo("Strong technical evidence for HR");
        assertThat(result.getCandidateComment()).isEqualTo("Clear reasoning and a strong interview");
        assertThat(result.getOverallScore()).isEqualByComparingTo("16");
        verify(notificationService).notify(candidate,
                "Resultat de votre entretien disponible",
                "Votre note pour Java Developer est 16/20. Recommandation : FAVORABLE.",
                "INTERVIEW_EVALUATION_SUBMITTED",
                "/candidate/interviews/7");
    }
}
