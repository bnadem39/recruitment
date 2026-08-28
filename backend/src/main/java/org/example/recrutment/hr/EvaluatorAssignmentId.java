package org.example.recrutment.hr;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class EvaluatorAssignmentId implements Serializable {
    private Long offer;
    private Long evaluator;
}
