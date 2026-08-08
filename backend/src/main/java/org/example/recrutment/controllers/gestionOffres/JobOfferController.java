package org.example.recrutment.controllers.gestionOffres;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.recrutment.dto.gestionOffres.JobOfferRequestDTO;
import org.example.recrutment.dto.gestionOffres.JobOfferResponseDTO;
import org.example.recrutment.entities.gestionOffres.OfferStatus;
import org.example.recrutment.services.gestionOffres.JobOfferService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST pour la gestion des offres d'emploi (JobOffer).
 * Base URL : /api/offers
 */
@RestController
@RequestMapping("/api/offers")
@Tag(name = "Offres", description = "Gestion des offres d'emploi et de stage")
public class JobOfferController {

    private final JobOfferService jobOfferService;

    public JobOfferController(JobOfferService jobOfferService) {
        this.jobOfferService = jobOfferService;
    }

    @PostMapping
    @Operation(summary = "Créer une nouvelle offre", description = "formId doit référencer un Form existant")
    public ResponseEntity<JobOfferResponseDTO> create(@Valid @RequestBody JobOfferRequestDTO request) {
        JobOfferResponseDTO created = jobOfferService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une offre par son id")
    public ResponseEntity<JobOfferResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(jobOfferService.getById(id));
    }

    @GetMapping
    @Operation(summary = "Lister toutes les offres")
    public ResponseEntity<List<JobOfferResponseDTO>> getAll() {
        return ResponseEntity.ok(jobOfferService.getAll());
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Lister les offres par statut", description = "Ex: PUBLISHED pour les offres visibles côté candidat")
    public ResponseEntity<List<JobOfferResponseDTO>> getAllByStatus(@PathVariable OfferStatus status) {
        return ResponseEntity.ok(jobOfferService.getAllByStatus(status));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une offre existante")
    public ResponseEntity<JobOfferResponseDTO> update(@PathVariable Long id, @Valid @RequestBody JobOfferRequestDTO request) {
        return ResponseEntity.ok(jobOfferService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une offre")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        jobOfferService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
