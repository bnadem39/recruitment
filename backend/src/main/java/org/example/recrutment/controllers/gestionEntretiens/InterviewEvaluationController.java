package org.example.recrutment.controllers.gestionEntretiens;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.recrutment.dto.gestionEntretiens.InterviewEvaluationRequestDTO;
import org.example.recrutment.dto.gestionEntretiens.InterviewEvaluationResponseDTO;
import org.example.recrutment.services.gestionEntretiens.InterviewEvaluationService;
import org.example.recrutment.services.gestionEntretiens.InterviewAuthorizationService;
import org.example.recrutment.entities.users.Users;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * Endpoints REST pour l'évaluation d'un entretien (InterviewEvaluation).
 * Imbriqué sous /api/interviews/{interviewId}/evaluation -- ressource
 * "singleton" (pas de collection ni d'id d'évaluation dans l'URL) car
 * la relation Interview <-> Evaluation est un OneToOne.
 */
@RestController
@RequestMapping("/api/interviews/{interviewId}/evaluation")
@Tag(name = "Évaluations d'entretien", description = "Notation détaillée et recommandation suite à un entretien")
@PreAuthorize("hasAnyRole('ADMIN', 'EVALUATOR')")
public class InterviewEvaluationController {

    private final InterviewEvaluationService interviewEvaluationService;
    private final InterviewAuthorizationService authorizationService;

    public InterviewEvaluationController(InterviewEvaluationService interviewEvaluationService,
                                         InterviewAuthorizationService authorizationService) {
        this.interviewEvaluationService = interviewEvaluationService;
        this.authorizationService = authorizationService;
    }

    @PostMapping
    @Operation(summary = "Créer l'évaluation d'un entretien", description = "Échoue avec 409 si une évaluation existe déjà -- utiliser PUT pour la modifier")
    public ResponseEntity<InterviewEvaluationResponseDTO> create(
            @AuthenticationPrincipal Users user,
            @PathVariable Long interviewId,
            @Valid @RequestBody InterviewEvaluationRequestDTO request) {
        authorizationService.requireEvaluationAccess(user, interviewId);
        InterviewEvaluationResponseDTO created = interviewEvaluationService.create(interviewId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @Operation(summary = "Récupérer l'évaluation d'un entretien")
    public ResponseEntity<InterviewEvaluationResponseDTO> getByInterview(@AuthenticationPrincipal Users user, @PathVariable Long interviewId) {
        authorizationService.requireEvaluationAccess(user, interviewId);
        return ResponseEntity.ok(interviewEvaluationService.getByInterview(interviewId));
    }

    @PutMapping
    @Operation(summary = "Modifier l'évaluation existante d'un entretien")
    public ResponseEntity<InterviewEvaluationResponseDTO> update(
            @AuthenticationPrincipal Users user,
            @PathVariable Long interviewId,
            @Valid @RequestBody InterviewEvaluationRequestDTO request) {
        authorizationService.requireEvaluationAccess(user, interviewId);
        return ResponseEntity.ok(interviewEvaluationService.update(interviewId, request));
    }

    @DeleteMapping
    @Operation(summary = "Supprimer l'évaluation d'un entretien")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Users user, @PathVariable Long interviewId) {
        authorizationService.requireEvaluationAccess(user, interviewId);
        interviewEvaluationService.delete(interviewId);
        return ResponseEntity.noContent().build();
    }
}
