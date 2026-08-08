package org.example.recrutment.dto.formulairesAdaptatifs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.formulairesAdaptatifs.ConditionAction;
import org.example.recrutment.entities.formulairesAdaptatifs.ConditionOperator;
import org.example.recrutment.entities.formulairesAdaptatifs.LogicalOperator;

/**
 * Données renvoyées pour une FieldCondition.
 * Inclut le label des champs source/cible (pas juste leur id) pour que
 * le Form Builder puisse afficher la règle de façon lisible sans requête
 * supplémentaire (ex: "SI 'Permis poids lourd' = 'true' ALORS SHOW 'FIMO'").
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldConditionResponseDTO {

    private Long id;
    private Long formId;

    private Long sourceFieldId;
    private String sourceFieldLabel;

    private Long targetFieldId;
    private String targetFieldLabel;

    private ConditionOperator operator;
    private String expectedValue;
    private ConditionAction action;
    private Integer conditionGroup;
    private LogicalOperator logicalOperator;
}
