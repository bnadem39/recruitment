package org.example.recrutment.exceptions;

import org.example.recrutment.auth.EmailDeliveryException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Intercepte les exceptions levées dans les controllers/services et les
 * transforme en réponses HTTP propres et cohérentes, plutôt que de laisser
 * Spring renvoyer une erreur 500 générique par défaut.
 *
 * Ce handler est global : il s'applique à TOUS les controllers de l'application,
 * pas seulement ceux du module Formulaires.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleAuthentication() {
        return error(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(AccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler({IllegalArgumentException.class, DataIntegrityViolationException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(Exception ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(EmailDeliveryException.class)
    public ResponseEntity<Map<String, Object>> handleEmailDelivery(EmailDeliveryException ex) {
        return error(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>(); body.put("timestamp", LocalDateTime.now()); body.put("status", status.value()); body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }

    /** Ressource introuvable (id inexistant) -> 404 NOT FOUND. */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("error", "Not Found");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    /** Erreurs de validation (@Valid sur un DTO) -> 400 BAD REQUEST avec le détail par champ. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation Failed");
        body.put("fieldErrors", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }
}
