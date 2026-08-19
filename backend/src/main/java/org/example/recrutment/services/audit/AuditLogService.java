package org.example.recrutment.services.audit;

import org.example.recrutment.entities.audit.AuditLog;
import java.util.List;
public interface AuditLogService { AuditLog create(AuditLog e); AuditLog update(Long id, AuditLog e); AuditLog getById(Long id); List<AuditLog> getAll(); void delete(Long id); }
