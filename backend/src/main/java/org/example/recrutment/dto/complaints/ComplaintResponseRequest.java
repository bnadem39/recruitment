package org.example.recrutment.dto.complaints;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComplaintResponseRequest(@NotBlank @Size(max = 10000) String response) {}
