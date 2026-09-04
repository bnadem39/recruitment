package org.example.recrutment.dto.complaints;

import org.example.recrutment.entities.complaints.ComplaintCategory;
import org.example.recrutment.entities.complaints.ComplaintStatus;

import java.time.LocalDateTime;

public record AdminComplaintResponse(
        Long id, String subject, String message, ComplaintCategory category,
        ComplaintStatus status, LocalDateTime createdAt, LocalDateTime updatedAt,
        String response, LocalDateTime respondedAt, Long userId, String userName,
        String userEmail, String userRole, Long respondedById, String respondedByName
) {}
