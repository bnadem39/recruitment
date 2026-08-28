package org.example.recrutment.hr;

import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.UserStatus;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.gestionOffres.JobOfferRepository;
import org.example.recrutment.repositories.users.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HrEvaluatorServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final JobOfferRepository offers = mock(JobOfferRepository.class);
    private final EvaluatorAssignmentRepository assignments = mock(EvaluatorAssignmentRepository.class);
    private final HrEvaluatorService service = new HrEvaluatorService(users, offers, assignments);

    @Test
    void listsActiveAndInactiveEvaluatorsWithTheirOfferAssignments() {
        Users active = evaluator(7L, "Amel", UserStatus.ACTIVE);
        Users disabled = evaluator(8L, "Sami", UserStatus.DISABLED);
        JobOffer offer = JobOffer.builder().id(21L).title("Analyste crédit").build();
        when(assignments.findAllWithDetails()).thenReturn(List.of(
                EvaluatorAssignment.builder().offer(offer).evaluator(active).build()));
        when(users.findByUserRoleOrderByFirstNameAscLastNameAsc(UserRole.EVALUATOR))
                .thenReturn(List.of(active, disabled));

        assertThat(service.list()).containsExactly(
                new EvaluatorResponse(7L, "Amel", "Test", "amel@example.com", UserStatus.ACTIVE,
                        List.of(new EvaluatorResponse.OfferAssignment(21L, "Analyste crédit"))),
                new EvaluatorResponse(8L, "Sami", "Test", "sami@example.com", UserStatus.DISABLED, List.of())
        );
    }

    @Test
    void replacesAnOffersAssignmentsWithActiveEvaluators() {
        Users second = evaluator(8L, "Sami", UserStatus.ACTIVE);
        JobOffer offer = JobOffer.builder().id(21L).title("Analyste crédit").build();
        when(offers.findById(21L)).thenReturn(Optional.of(offer));
        when(users.findAllById(new LinkedHashSet<>(List.of(8L)))).thenReturn(List.of(second));

        assertThat(service.assign(21L, List.of(8L))).containsExactly(8L);
        verify(assignments).deleteByOfferId(21L);
        verify(assignments).flush();
        verify(assignments).saveAll(anyList());
    }

    @Test
    void refusesToAssignAnInactiveEvaluator() {
        Users disabled = evaluator(8L, "Sami", UserStatus.DISABLED);
        JobOffer offer = JobOffer.builder().id(21L).title("Analyste crédit").build();
        when(offers.findById(21L)).thenReturn(Optional.of(offer));
        when(users.findAllById(new LinkedHashSet<>(List.of(8L)))).thenReturn(List.of(disabled));

        assertThatThrownBy(() -> service.assign(21L, List.of(8L)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("évaluateur inactif");
    }

    private Users evaluator(Long id, String firstName, UserStatus status) {
        return Users.builder().id(id).firstName(firstName).lastName("Test")
                .email(firstName.toLowerCase() + "@example.com")
                .userRole(UserRole.EVALUATOR).status(status).build();
    }
}
