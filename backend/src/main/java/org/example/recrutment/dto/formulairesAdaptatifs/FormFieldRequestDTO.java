package org.example.recrutment.dto.formulairesAdaptatifs;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.formulairesAdaptatifs.FieldType;

import java.math.BigDecimal;

/**
 * Données envoyées par l'admin (Form Builder) pour créer ou modifier un champ.
 * Ne contient pas formId : il est fourni dans l'URL (/api/forms/{formId}/fields),
 * pas dans le corps de la requête, pour éviter toute incohérence entre les deux.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormFieldRequestDTO {

    @NotBlank(message = "Le label du champ est obligatoire")
    private String label;

    @NotNull(message = "Le type du champ est obligatoire")
    private FieldType fieldType;

    private Boolean required;

    private String placeholder;

    private Boolean defaultVisible;

    @NotNull(message = "L'ordre d'affichage est obligatoire")
    private Integer displayOrder;

    private String validationRule;

    private BigDecimal minimumValue;

    private BigDecimal maximumValue;

    private Integer minimumLength;

    private Integer maximumLength;
}
