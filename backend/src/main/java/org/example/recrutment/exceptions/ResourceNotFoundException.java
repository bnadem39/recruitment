package org.example.recrutment.exceptions;

/**
 * Exception levée lorsqu'une ressource demandée (par id) n'existe pas en base.
 * Interceptée globalement pour renvoyer un statut HTTP 404 (voir GlobalExceptionHandler).
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
