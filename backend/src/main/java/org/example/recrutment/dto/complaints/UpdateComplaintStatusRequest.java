package org.example.recrutment.dto.complaints;

import jakarta.validation.constraints.NotNull;
import org.example.recrutment.entities.complaints.ComplaintStatus;

public record UpdateComplaintStatusRequest(@NotNull ComplaintStatus status) {}
