package org.example.recrutment.repositories;

import org.example.recrutment.entities.application.ApplicationDocument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, Long> {}
