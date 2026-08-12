package org.example.recrutment.dto.formulairesAdaptatifs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.formulairesAdaptatifs.FieldType;

import java.math.BigDecimal;

/**
 * Données renvoyées au client après une opération sur un FormField.
 * Inclut formId pour que le frontend sache à quel formulaire ce champ appartient,
 * utile notamment si les champs sont affichés/manipulés hors du contexte imbriqué.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormFieldResponseDTO {

    private Long id;
    private Long formId;
    private String label;
    private FieldType fieldType;
    private Boolean required;
    private String placeholder;
    private Boolean defaultVisible;
    private Integer displayOrder;
    private String validationRule;
    private BigDecimal minimumValue;
    private BigDecimal maximumValue;
    private Integer minimumLength;
    private Integer maximumLength;
}