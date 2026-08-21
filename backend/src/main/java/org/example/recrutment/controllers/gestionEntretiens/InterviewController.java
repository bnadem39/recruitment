package org.example.recrutment.controllers.gestionEntretiens;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.recrutment.dto.gestionEntretiens.InterviewRequestDTO;
import org.example.recrutment.dto.gestionEntretiens.InterviewResponseDTO;
import org.example.recrutment.services.gestionEntretiens.InterviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

/**
 * Endpoints REST pour la gestion des entretiens (Interview).
 * Base URL : /api/interviews
 */
@RestController
@RequestMapping("/api/interviews")
@Tag(name = "Entretiens", description = "Gestion des entretiens de recrutement")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping
    @Operation(summary = "Planifier un nouvel entretien", description = "applicationId doit référencer une candidature existante")
    public ResponseEntity<InterviewResponseDTO> create(@Valid @RequestBody InterviewRequestDTO request) {
        InterviewResponseDTO created = interviewService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un entretien par son id")
    public ResponseEntity<InterviewResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(interviewService.getById(id));
    }

    @GetMapping
    @Operation(summary = "Lister tous les entretiens")
    public ResponseEntity<List<InterviewResponseDTO>> getAll() {
        return ResponseEntity.ok(interviewService.getAll());
    }

    @GetMapping("/application/{applicationId}")
    @Operation(summary = "Lister les entretiens d'une candidature précise")
    public ResponseEntity<List<InterviewResponseDTO>> getAllByApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(interviewService.getAllByApplication(applicationId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un entretien existant")
    public ResponseEntity<InterviewResponseDTO> update(@PathVariable Long id, @Valid @RequestBody InterviewRequestDTO request) {
        return ResponseEntity.ok(interviewService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer/annuler un entretien")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        interviewService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
