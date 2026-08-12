package org.example.recrutment.controllers.audit;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.audit.AuditLog;
import org.example.recrutment.services.audit.AuditLogService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/audit-logs") @RequiredArgsConstructor
public class AuditLogController {
  private final AuditLogService service;
  @PostMapping public ResponseEntity<AuditLog> create(@RequestBody AuditLog e){ return new ResponseEntity<>(service.create(e), HttpStatus.CREATED);}
  @GetMapping public ResponseEntity<List<AuditLog>> getAll(){ return ResponseEntity.ok(service.getAll());}
  @GetMapping("/{id}") public ResponseEntity<AuditLog> getById(@PathVariable Long id){ return ResponseEntity.ok(service.getById(id));}
  @PutMapping("/{id}") public ResponseEntity<AuditLog> update(@PathVariable Long id,@RequestBody AuditLog e){ return ResponseEntity.ok(service.update(id,e));}
  @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){ service.delete(id); return ResponseEntity.noContent().build();}
}
