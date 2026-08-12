package org.example.recrutment.dto.formulairesAdaptatifs;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Données envoyées pour créer ou modifier une option d'un champ
 * de type SELECT, MULTI_SELECT ou RADIO.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldOptionRequestDTO {

    @NotBlank(message = "Le label de l'option est obligatoire")
    private String label;

    @NotBlank(message = "La valeur de l'option est obligatoire")
    private String value;

    @NotNull(message = "L'ordre d'affichage est obligatoire")
    private Integer displayOrder;
}
