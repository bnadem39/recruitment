package org.example.recrutment.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.audit.AuditLog;
import org.example.recrutment.repositories.audit.AuditLogRepository;
import org.example.recrutment.services.audit.AuditLogService;
import org.springframework.stereotype.Service;
import java.util.List;
@Service @RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {
  private final AuditLogRepository repo;
  public AuditLog create(AuditLog e){ return repo.save(e);} public AuditLog update(Long id, AuditLog e){var c=getById(id); c.setAction(e.getAction()); c.setEntityType(e.getEntityType()); c.setEntityId(e.getEntityId()); c.setOldValue(e.getOldValue()); c.setNewValue(e.getNewValue()); c.setIpAddress(e.getIpAddress()); c.setCreatedBy(e.getCreatedBy()); return repo.save(c);} public AuditLog getById(Long id){ return repo.findById(id).orElseThrow(()->new org.example.recrutment.shared.exceptions.ResourceNotFoundException("AuditLog introuvable avec l'id "+id));} public List<AuditLog> getAll(){ return repo.findAll(); } public void delete(Long id){ repo.delete(getById(id)); }
}
