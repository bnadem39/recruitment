package org.example.recrutment.controllers.candidatures;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.application.ApplicationDocument;
import org.example.recrutment.services.candidatures.ApplicationDocumentService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/application-documents") @RequiredArgsConstructor
public class ApplicationDocumentController {
  private final ApplicationDocumentService service;
  @PostMapping public ResponseEntity<ApplicationDocument> create(@RequestBody ApplicationDocument e){ return new ResponseEntity<>(service.create(e), HttpStatus.CREATED);}
  @GetMapping public ResponseEntity<List<ApplicationDocument>> getAll(){ return ResponseEntity.ok(service.getAll());}
  @GetMapping("/{id}") public ResponseEntity<ApplicationDocument> getById(@PathVariable Long id){ return ResponseEntity.ok(service.getById(id));}
  @PutMapping("/{id}") public ResponseEntity<ApplicationDocument> update(@PathVariable Long id,@RequestBody ApplicationDocument e){ return ResponseEntity.ok(service.update(id,e));}
  @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){ service.delete(id); return ResponseEntity.noContent().build();}
}
