package org.example.recrutment.controllers.formulairesAdaptatifs;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.recrutment.dto.formulairesAdaptatifs.FieldOptionRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FieldOptionResponseDTO;
import org.example.recrutment.services.formulairesAdaptatifs.FieldOptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST pour la gestion des options d'un champ (FieldOption).
 * Imbriqué sous /api/forms/{formId}/fields/{fieldId}/options.
 */
@RestController
@RequestMapping("/api/forms/{formId}/fields/{fieldId}/options")
@Tag(name = "Options de champ", description = "Gestion des options (FieldOption) d'un champ SELECT/RADIO/MULTI_SELECT")
public class FieldOptionController {

    private final FieldOptionService fieldOptionService;

    public FieldOptionController(FieldOptionService fieldOptionService) {
        this.fieldOptionService = fieldOptionService;
    }

    @PostMapping
    @Operation(summary = "Ajouter une option à un champ")
    public ResponseEntity<FieldOptionResponseDTO> create(
            @PathVariable Long formId,
            @PathVariable Long fieldId,
            @Valid @RequestBody FieldOptionRequestDTO request) {
        FieldOptionResponseDTO created = fieldOptionService.create(formId, fieldId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{optionId}")
    @Operation(summary = "Récupérer une option précise")
    public ResponseEntity<FieldOptionResponseDTO> getById(
            @PathVariable Long formId,
            @PathVariable Long fieldId,
            @PathVariable Long optionId) {
        return ResponseEntity.ok(fieldOptionService.getById(formId, fieldId, optionId));
    }

    @GetMapping
    @Operation(summary = "Lister toutes les options d'un champ")
    public ResponseEntity<List<FieldOptionResponseDTO>> getAllByField(
            @PathVariable Long formId,
            @PathVariable Long fieldId) {
        return ResponseEntity.ok(fieldOptionService.getAllByField(formId, fieldId));
    }

    @PutMapping("/{optionId}")
    @Operation(summary = "Modifier une option existante")
    public ResponseEntity<FieldOptionResponseDTO> update(
            @PathVariable Long formId,
            @PathVariable Long fieldId,
            @PathVariable Long optionId,
            @Valid @RequestBody FieldOptionRequestDTO request) {
        return ResponseEntity.ok(fieldOptionService.update(formId, fieldId, optionId, request));
    }

    @DeleteMapping("/{optionId}")
    @Operation(summary = "Supprimer une option")
    public ResponseEntity<Void> delete(
            @PathVariable Long formId,
            @PathVariable Long fieldId,
            @PathVariable Long optionId) {
        fieldOptionService.delete(formId, fieldId, optionId);
        return ResponseEntity.noContent().build();
    }
}