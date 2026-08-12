package org.example.recrutment.services;

import org.example.recrutment.entities.application.ApplicationDocument;
import java.util.List;
public interface ApplicationDocumentService { ApplicationDocument create(ApplicationDocument e); ApplicationDocument update(Long id, ApplicationDocument e); ApplicationDocument getById(Long id); List<ApplicationDocument> getAll(); void delete(Long id); }
