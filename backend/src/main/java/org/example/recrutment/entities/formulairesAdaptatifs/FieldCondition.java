package org.example.recrutment.entities.formulairesAdaptatifs;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import org.example.recrutment.entities.formulairesAdaptatifs.ConditionAction;
import org.example.recrutment.entities.formulairesAdaptatifs.ConditionOperator;
import org.example.recrutment.entities.formulairesAdaptatifs.LogicalOperator;

@Entity
@Table(name = "field_conditions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class FieldCondition {

    // ==================== Identifiant ====================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== Attributs ====================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConditionOperator operator;

    @Column(name = "expected_value")
    private String expectedValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConditionAction action;

    @Column(name = "condition_group")
    private Integer conditionGroup;

    @Enumerated(EnumType.STRING)
    @Column(name = "logical_operator")
    private LogicalOperator logicalOperator;

    // ==================== Relations ====================

}