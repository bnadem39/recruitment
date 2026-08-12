package org.example.recrutment.repositories.formulairesAdaptatifs;

import org.example.recrutment.entities.formulairesAdaptatifs.Form;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository JPA pour l'entité Form.
 */
@Repository
public interface FormRepository extends JpaRepository<Form, Long> {

    /** Récupère uniquement les formulaires actifs (utile pour l'espace candidat). */
    List<Form> findByActiveTrue();
}