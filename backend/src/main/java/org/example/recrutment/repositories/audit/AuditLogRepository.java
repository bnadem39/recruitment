package org.example.recrutment.repositories.audit;

import org.example.recrutment.entities.audit.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {}
