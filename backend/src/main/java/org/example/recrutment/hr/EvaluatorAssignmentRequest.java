package org.example.recrutment.hr;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record EvaluatorAssignmentRequest(@NotNull List<Long> evaluatorIds) {}
