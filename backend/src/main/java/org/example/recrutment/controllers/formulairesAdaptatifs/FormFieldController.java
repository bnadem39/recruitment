package org.example.recrutment.controllers.formulairesAdaptatifs;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.recrutment.dto.formulairesAdaptatifs.FormFieldRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FormFieldResponseDTO;
import org.example.recrutment.services.formulairesAdaptatifs.FormFieldService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST pour la gestion des champs d'un formulaire (FormField).
 * Imbriqué sous /api/forms/{formId}/fields : un champ n'existe jamais
 * indépendamment de son formulaire parent.
 */
@RestController
@RequestMapping("/api/forms/{formId}/fields")
@Tag(name = "Champs de formulaire", description = "Gestion des champs (FormField) d'un formulaire dynamique")
public class FormFieldController {

    private final FormFieldService formFieldService;

    public FormFieldController(FormFieldService formFieldService) {
        this.formFieldService = formFieldService;
    }

    @PostMapping
    @Operation(summary = "Ajouter un champ à un formulaire")
    public ResponseEntity<FormFieldResponseDTO> create(
            @PathVariable Long formId,
            @Valid @RequestBody FormFieldRequestDTO request) {
        FormFieldResponseDTO created = formFieldService.create(formId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{fieldId}")
    @Operation(summary = "Récupérer un champ précis d'un formulaire")
    public ResponseEntity<FormFieldResponseDTO> getById(
            @PathVariable Long formId,
            @PathVariable Long fieldId) {
        return ResponseEntity.ok(formFieldService.getById(formId, fieldId));
    }

    @GetMapping
    @Operation(summary = "Lister tous les champs d'un formulaire, triés par ordre d'affichage")
    public ResponseEntity<List<FormFieldResponseDTO>> getAllByForm(@PathVariable Long formId) {
        return ResponseEntity.ok(formFieldService.getAllByForm(formId));
    }

    @PutMapping("/{fieldId}")
    @Operation(summary = "Modifier un champ existant")
    public ResponseEntity<FormFieldResponseDTO> update(
            @PathVariable Long formId,
            @PathVariable Long fieldId,
            @Valid @RequestBody FormFieldRequestDTO request) {
        return ResponseEntity.ok(formFieldService.update(formId, fieldId, request));
    }

    @DeleteMapping("/{fieldId}")
    @Operation(summary = "Supprimer un champ")
    public ResponseEntity<Void> delete(
            @PathVariable Long formId,
            @PathVariable Long fieldId) {
        formFieldService.delete(formId, fieldId);
        return ResponseEntity.noContent().build();
    }
}
