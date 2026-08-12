package org.example.recrutment.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.application.ApplicationDocument;
import org.example.recrutment.repositories.ApplicationDocumentRepository;
import org.example.recrutment.services.ApplicationDocumentService;
import org.springframework.stereotype.Service;
import java.util.List;
@Service @RequiredArgsConstructor
public class ApplicationDocumentServiceImpl implements ApplicationDocumentService {
  private final ApplicationDocumentRepository repo;
  public ApplicationDocument create(ApplicationDocument e){ return repo.save(e);} public ApplicationDocument update(Long id, ApplicationDocument e){var c=getById(id); c.setApplication(e.getApplication()); c.setOriginalName(e.getOriginalName()); c.setStoragePath(e.getStoragePath()); c.setMimeType(e.getMimeType()); c.setFileSize(e.getFileSize()); c.setVerificationStatus(e.getVerificationStatus()); c.setRejectionReason(e.getRejectionReason()); c.setUploadedAt(e.getUploadedAt()); return repo.save(c);} public ApplicationDocument getById(Long id){ return repo.findById(id).orElseThrow(()->new org.example.recrutment.shared.exceptions.ResourceNotFoundException("ApplicationDocument introuvable avec l'id "+id));} public List<ApplicationDocument> getAll(){ return repo.findAll(); } public void delete(Long id){ repo.delete(getById(id)); }
}
