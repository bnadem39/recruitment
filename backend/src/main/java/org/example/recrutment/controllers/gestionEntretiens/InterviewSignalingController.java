package org.example.recrutment.controllers.gestionEntretiens;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.dto.gestionEntretiens.InterviewSignalMessage;
import org.example.recrutment.services.gestionEntretiens.InterviewSignalingService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class InterviewSignalingController {
    private final InterviewSignalingService signalingService;

    @MessageMapping("/interviews/{interviewId}/signal")
    public void signal(Principal principal, @DestinationVariable Long interviewId, InterviewSignalMessage message) {
        signalingService.handle(principal.getName(), interviewId, message);
    }
}
