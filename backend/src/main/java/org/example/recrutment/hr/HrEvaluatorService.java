package org.example.recrutment.hr;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.UserStatus;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.gestionOffres.JobOfferRepository;
import org.example.recrutment.repositories.users.UserRepository;
import org.example.recrutment.services.notifications.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HrEvaluatorService {
    private final UserRepository users;
    private final JobOfferRepository offers;
    private final EvaluatorAssignmentRepository assignmentRepository;
    private final NotificationService notifications;

    @Transactional(readOnly = true)
    public List<EvaluatorResponse> list() {
        Map<Long, List<EvaluatorResponse.OfferAssignment>> assignments = assignmentRepository.findAllWithDetails().stream()
                .map(assignment -> Map.entry(assignment.getEvaluator().getId(), assignment.getOffer()))
                .collect(Collectors.groupingBy(Map.Entry::getKey,
                        Collectors.mapping(entry -> new EvaluatorResponse.OfferAssignment(
                                entry.getValue().getId(), entry.getValue().getTitle()), Collectors.toList())));

        assignments.values().forEach(items -> items.sort(Comparator.comparing(EvaluatorResponse.OfferAssignment::title,
                String.CASE_INSENSITIVE_ORDER)));

        return users.findByUserRoleOrderByFirstNameAscLastNameAsc(UserRole.EVALUATOR)
                .stream()
                .map(user -> new EvaluatorResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(),
                        user.getStatus(), assignments.getOrDefault(user.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Long> assignedEvaluatorIds(Long offerId) {
        findOffer(offerId);
        return assignmentRepository.findByOfferIdWithEvaluator(offerId).stream()
                .map(assignment -> assignment.getEvaluator().getId())
                .sorted()
                .toList();
    }

    @Transactional
    public List<Long> assign(Long offerId, List<Long> evaluatorIds) {
        JobOffer offer = findOffer(offerId);
        java.util.Set<Long> currentIds = assignmentRepository.findByOfferIdWithEvaluator(offerId).stream()
                .map(assignment -> assignment.getEvaluator().getId())
                .collect(Collectors.toSet());
        LinkedHashSet<Long> requestedIds = new LinkedHashSet<>(evaluatorIds);
        List<Users> evaluators = users.findAllById(requestedIds);
        Map<Long, Users> evaluatorsById = evaluators.stream()
                .collect(Collectors.toMap(Users::getId, Function.identity()));

        List<Long> missingIds = requestedIds.stream().filter(id -> !evaluatorsById.containsKey(id)).toList();
        if (!missingIds.isEmpty()) {
            throw new ResourceNotFoundException("Évaluateur introuvable : " + missingIds.get(0));
        }

        for (Users evaluator : evaluators) {
            if (evaluator.getUserRole() != UserRole.EVALUATOR) {
                throw new IllegalArgumentException("Seuls les comptes évaluateur peuvent être affectés à une offre");
            }
            if (evaluator.getStatus() != UserStatus.ACTIVE) {
                throw new IllegalArgumentException("Impossible d'affecter un évaluateur inactif : " + evaluator.getEmail());
            }
        }

        assignmentRepository.deleteByOfferId(offerId);
        assignmentRepository.flush();
        List<EvaluatorAssignment> savedAssignments = requestedIds.stream()
                .map(evaluatorsById::get)
                .map(evaluator -> EvaluatorAssignment.builder().offer(offer).evaluator(evaluator).build())
                .toList();
        assignmentRepository.saveAll(savedAssignments);
        evaluators.stream()
                .filter(evaluator -> !currentIds.contains(evaluator.getId()))
                .forEach(evaluator -> notifications.notify(evaluator, "New evaluator assignment",
                        "You have been assigned to review applications for " + offer.getTitle() + ".",
                        "EVALUATOR_ASSIGNED", "/evaluator/applications"));
        return requestedIds.stream().sorted().toList();
    }

    private JobOffer findOffer(Long offerId) {
        return offers.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offre introuvable : " + offerId));
    }
}
