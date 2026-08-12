package org.example.recrutment.controllers.candidatures;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.recrutment.dto.candidatures.ApplicationRequestDTO;
import org.example.recrutment.dto.candidatures.ApplicationResponseDTO;
import org.example.recrutment.services.candidatures.ApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST pour la gestion des candidatures (Application).
 * Base URL : /api/applications
 */
@RestController
@RequestMapping("/api/applications")
@Tag(name = "Candidatures", description = "Gestion des candidatures déposées par les candidats")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    @Operation(summary = "Créer une nouvelle candidature", description = "candidateId et jobOfferId doivent référencer des entités existantes")
    public ResponseEntity<ApplicationResponseDTO> create(@Valid @RequestBody ApplicationRequestDTO request) {
        ApplicationResponseDTO created = applicationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une candidature par son id")
    public ResponseEntity<ApplicationResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getById(id));
    }

    @GetMapping
    @Operation(summary = "Lister toutes les candidatures")
    public ResponseEntity<List<ApplicationResponseDTO>> getAll() {
        return ResponseEntity.ok(applicationService.getAll());
    }

    @GetMapping("/candidate/{candidateId}")
    @Operation(summary = "Lister les candidatures d'un candidat précis")
    public ResponseEntity<List<ApplicationResponseDTO>> getAllByCandidate(@PathVariable Long candidateId) {
        return ResponseEntity.ok(applicationService.getAllByCandidate(candidateId));
    }

    @GetMapping("/offer/{jobOfferId}")
    @Operation(summary = "Lister les candidatures reçues pour une offre précise")
    public ResponseEntity<List<ApplicationResponseDTO>> getAllByJobOffer(@PathVariable Long jobOfferId) {
        return ResponseEntity.ok(applicationService.getAllByJobOffer(jobOfferId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une candidature existante")
    public ResponseEntity<ApplicationResponseDTO> update(@PathVariable Long id, @Valid @RequestBody ApplicationRequestDTO request) {
        return ResponseEntity.ok(applicationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une candidature")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        applicationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
