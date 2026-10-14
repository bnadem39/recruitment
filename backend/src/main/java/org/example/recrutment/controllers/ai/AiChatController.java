package org.example.recrutment.controllers.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Passerelle entre le frontend et le service d'IA (FastAPI).
 * Le navigateur n'appelle JAMAIS le service d'IA directement :
 * Spring Boot vérifie le JWT et le rôle, puis transmet la demande.
 */
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    public record AiChatRequest(
            @NotBlank @Size(max = 1000) String question,
            String offerId) {}

    private final RestTemplate rest;
    private final String aiServiceUrl;

    public AiChatController(@Value("${ai.service.url:http://localhost:8001}") String aiServiceUrl) {
        this.aiServiceUrl = aiServiceUrl;
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(5_000);
        f.setReadTimeout(90_000); // le LLM peut être lent
        this.rest = new RestTemplate(f);
    }

    // ADAPTE le nom du rôle : "HR", "RH", "AGENT_RH"... comme dans ton enum de rôles.
    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<?> chat(@Valid @RequestBody AiChatRequest req,
                                  @RequestHeader(value = "Authorization", required = false) String auth) {
        Map<String, Object> body = new HashMap<>();
        body.put("question", req.question());
        body.put("offer_id", req.offerId());
        if (auth != null && auth.startsWith("Bearer ")) {
            body.put("jwt", auth.substring(7)); // l'agent agit avec les droits de l'utilisateur
        }
        try {
            Map<?, ?> res = rest.postForObject(aiServiceUrl + "/agent/chat", body, Map.class);
            return ResponseEntity.ok(res);
        } catch (ResourceAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Le service d'IA est indisponible."));
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Erreur du service d'IA (" + e.getStatusCode().value() + ")."));
        }
    }
}
