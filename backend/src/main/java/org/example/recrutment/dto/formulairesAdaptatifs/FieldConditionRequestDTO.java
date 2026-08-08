package org.example.recrutment.dto.formulairesAdaptatifs;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.formulairesAdaptatifs.ConditionAction;
import org.example.recrutment.entities.formulairesAdaptatifs.ConditionOperator;
import org.example.recrutment.entities.formulairesAdaptatifs.LogicalOperator;

/**
 * Données envoyées pour créer/modifier une règle de logique conditionnelle.
 * sourceFieldId et targetFieldId référencent des FormField par leur id --
 * le service vérifie que les deux appartiennent bien au formulaire (formId)
 * fourni dans l'URL avant de créer la relation.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldConditionRequestDTO {

    @NotNull(message = "Le champ source est obligatoire")
    private Long sourceFieldId;

    @NotNull(message = "Le champ cible est obligatoire")
    private Long targetFieldId;

    @NotNull(message = "L'opérateur est obligatoire")
    private ConditionOperator operator;

    private String expectedValue;

    @NotNull(message = "L'action est obligatoire")
    private ConditionAction action;

    private Integer conditionGroup;

    private LogicalOperator logicalOperator;
}
