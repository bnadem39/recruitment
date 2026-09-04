package org.example.recrutment.services.gestionEntretiens;

import org.example.recrutment.dto.gestionEntretiens.InterviewEvaluationRequestDTO;
import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.candidatures.FinalDecision;
import org.example.recrutment.entities.gestionEntretiens.Interview;
import org.example.recrutment.entities.gestionEntretiens.InterviewEvaluation;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;
import org.example.recrutment.entities.gestionEntretiens.Recommendation;
import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.users.Candidates;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
        Interview interview = Interview.builder().id(7L).application(application).status(InterviewStatus.COMPLETED).build();
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
        assertThat(interview.getEvaluation()).isNotNull();
        verify(notificationService).notify(candidate,
                "Interview evaluation completed",
                "Your interview evaluation for Java Developer has been completed.",
                "INTERVIEW_EVALUATION_SUBMITTED",
                "/candidate/interviews/7");
    }

    @Test
    void createAllowsInterviewEvaluationWhenApplicationHasFormEvaluation() {
        Candidates candidate = Candidates.builder().id(22L).email("candidate@example.com").build();
        JobOffer offer = JobOffer.builder().title("Java Developer").build();
        Application application = Application.builder()
                .candidate(candidate)
                .jobOffer(offer)
                .formScore(82)
                .formHrComment("Strong application form")
                .formCandidateComment("Your profile aligns well")
                .formDecision(FinalDecision.ACCEPTED)
                .build();
        Interview interview = Interview.builder().id(9L).application(application).status(InterviewStatus.COMPLETED).build();
        InterviewEvaluationRequestDTO request = InterviewEvaluationRequestDTO.builder()
                .technicalScore(new BigDecimal("18"))
                .communicationScore(new BigDecimal("17"))
                .motivationScore(new BigDecimal("16"))
                .professionalismScore(new BigDecimal("18"))
                .overallScore(new BigDecimal("17.25"))
                .recommendation(Recommendation.FAVORABLE)
                .hrComment("Final interview validated")
                .candidateComment("Strong match for the role")
                .build();
        when(interviewRepository.findById(9L)).thenReturn(Optional.of(interview));
        when(interviewRepository.save(interview)).thenReturn(interview);

        var result = new InterviewEvaluationServiceImpl(interviewRepository, notificationService)
                .create(9L, request);

        assertThat(result.getOverallScore()).isEqualByComparingTo("17.25");
        assertThat(application.getFormScore()).isEqualTo(82);
        assertThat(application.getFormDecision()).isEqualTo(FinalDecision.ACCEPTED);
        assertThat(interview.getEvaluation()).isNotNull();
    }

    @Test
    void createRejectsDuplicateInterviewEvaluationOnly() {
        Candidates candidate = Candidates.builder().id(22L).email("candidate@example.com").build();
        JobOffer offer = JobOffer.builder().title("Java Developer").build();
        Application application = Application.builder()
                .candidate(candidate)
                .jobOffer(offer)
                .formScore(80)
                .formDecision(FinalDecision.ACCEPTED)
                .build();
        Interview interview = Interview.builder().id(11L).application(application).status(InterviewStatus.COMPLETED).build();
        interview.setEvaluation(InterviewEvaluation.builder().overallScore(new BigDecimal("17")).build());
        InterviewEvaluationRequestDTO request = InterviewEvaluationRequestDTO.builder()
                .technicalScore(new BigDecimal("15"))
                .communicationScore(new BigDecimal("15"))
                .motivationScore(new BigDecimal("15"))
                .professionalismScore(new BigDecimal("15"))
                .overallScore(new BigDecimal("15"))
                .recommendation(Recommendation.RESERVED)
                .hrComment("Already submitted")
                .candidateComment("Already submitted")
                .build();
        when(interviewRepository.findById(11L)).thenReturn(Optional.of(interview));

        assertThatThrownBy(() -> new InterviewEvaluationServiceImpl(interviewRepository, notificationService)
                .create(11L, request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("This interview already has an interview evaluation");
    }
}
