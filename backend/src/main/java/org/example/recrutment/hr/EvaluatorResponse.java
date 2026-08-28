package org.example.recrutment.hr;

import org.example.recrutment.entities.users.UserStatus;

import java.util.List;

public record EvaluatorResponse(Long id, String firstName, String lastName, String email,
                                UserStatus status, List<OfferAssignment> assignedOffers) {
    public record OfferAssignment(Long id, String title) {}
}
