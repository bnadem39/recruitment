package org.example.recrutment.dto.complaints;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.example.recrutment.entities.complaints.ComplaintCategory;

public record CreateComplaintRequest(
        @NotBlank @Size(max = 200) String subject,
        @NotBlank @Size(min = 10, max = 10000) String message,
        @NotNull ComplaintCategory category
) {}
