package org.example.recrutment.controllers.formulairesAdaptatifs;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.recrutment.dto.formulairesAdaptatifs.FieldConditionRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FieldConditionResponseDTO;
import org.example.recrutment.services.formulairesAdaptatifs.FieldConditionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST pour la gestion des règles de logique conditionnelle (FieldCondition).
 * Imbriqué sous /api/forms/{formId}/conditions -- une condition relie toujours
 * deux champs (sourceFieldId, targetFieldId) du même formulaire.
 */
@RestController
@RequestMapping("/api/forms/{formId}/conditions")
@Tag(name = "Conditions de champ", description = "Gestion de la logique conditionnelle entre champs d'un formulaire")
public class FieldConditionController {

    private final FieldConditionService fieldConditionService;

    public FieldConditionController(FieldConditionService fieldConditionService) {
        this.fieldConditionService = fieldConditionService;
    }

    @PostMapping
    @Operation(summary = "Créer une règle de logique conditionnelle",
            description = "sourceFieldId et targetFieldId doivent référencer des champs existants de ce formulaire")
    public ResponseEntity<FieldConditionResponseDTO> create(
            @PathVariable Long formId,
            @Valid @RequestBody FieldConditionRequestDTO request) {
        FieldConditionResponseDTO created = fieldConditionService.create(formId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{conditionId}")
    @Operation(summary = "Récupérer une condition précise")
    public ResponseEntity<FieldConditionResponseDTO> getById(
            @PathVariable Long formId,
            @PathVariable Long conditionId) {
        return ResponseEntity.ok(fieldConditionService.getById(formId, conditionId));
    }

    @GetMapping
    @Operation(summary = "Lister toutes les conditions d'un formulaire")
    public ResponseEntity<List<FieldConditionResponseDTO>> getAllByForm(@PathVariable Long formId) {
        return ResponseEntity.ok(fieldConditionService.getAllByForm(formId));
    }

    @PutMapping("/{conditionId}")
    @Operation(summary = "Modifier une condition existante")
    public ResponseEntity<FieldConditionResponseDTO> update(
            @PathVariable Long formId,
            @PathVariable Long conditionId,
            @Valid @RequestBody FieldConditionRequestDTO request) {
        return ResponseEntity.ok(fieldConditionService.update(formId, conditionId, request));
    }

    @DeleteMapping("/{conditionId}")
    @Operation(summary = "Supprimer une condition")
    public ResponseEntity<Void> delete(
            @PathVariable Long formId,
            @PathVariable Long conditionId) {
        fieldConditionService.delete(formId, conditionId);
        return ResponseEntity.noContent().build();
    }
}