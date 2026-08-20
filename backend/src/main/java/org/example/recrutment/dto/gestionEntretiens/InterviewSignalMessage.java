package org.example.recrutment.dto.gestionEntretiens;

import com.fasterxml.jackson.databind.JsonNode;

public record InterviewSignalMessage(SignalType type, JsonNode payload) {
    public enum SignalType { JOIN, READY, OFFER, ANSWER, ICE_CANDIDATE, LEAVE }
}
