package org.example.recrutment.controllers.formulairesAdaptatifs;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.recrutment.dto.formulairesAdaptatifs.FormRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FormResponseDTO;
import org.example.recrutment.services.formulairesAdaptatifs.FormService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST pour la gestion des formulaires dynamiques (Form).
 * Base URL : /api/forms
 */
@RestController
@RequestMapping("/api/forms")
@Tag(name = "Formulaires", description = "Gestion des templates de formulaires dynamiques")
public class FormController {

    private final FormService formService;

    public FormController(FormService formService) {
        this.formService = formService;
    }

    @PostMapping
    @Operation(summary = "Créer un nouveau formulaire", description = "Crée un template de formulaire vide (les champs sont ajoutés séparément)")
    public ResponseEntity<FormResponseDTO> create(@Valid @RequestBody FormRequestDTO request) {
        FormResponseDTO created = formService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un formulaire par son id")
    public ResponseEntity<FormResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(formService.getById(id));
    }

    @GetMapping
    @Operation(summary = "Lister tous les formulaires")
    public ResponseEntity<List<FormResponseDTO>> getAll() {
        return ResponseEntity.ok(formService.getAll());
    }

    @GetMapping("/active")
    @Operation(summary = "Lister uniquement les formulaires actifs")
    public ResponseEntity<List<FormResponseDTO>> getAllActive() {
        return ResponseEntity.ok(formService.getAllActive());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un formulaire existant")
    public ResponseEntity<FormResponseDTO> update(@PathVariable Long id, @Valid @RequestBody FormRequestDTO request) {
        return ResponseEntity.ok(formService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un formulaire")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        formService.delete(id);
        return ResponseEntity.noContent().build();
    }
}