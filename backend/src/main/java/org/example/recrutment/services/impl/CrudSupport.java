package org.example.recrutment.services.impl;

import org.example.recrutment.shared.exceptions.ResourceNotFoundException;

public abstract class CrudSupport {
    protected <T> T notFound(Long id, String label) {
        throw new ResourceNotFoundException(label + " introuvable avec l'id " + id);
    }
}
