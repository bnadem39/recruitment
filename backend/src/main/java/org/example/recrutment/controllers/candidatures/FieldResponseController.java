package org.example.recrutment.controllers.candidatures;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.application.FieldResponse;
import org.example.recrutment.services.candidatures.FieldResponseService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/field-responses") @RequiredArgsConstructor
public class FieldResponseController {
  private final FieldResponseService service;
  @PostMapping public ResponseEntity<FieldResponse> create(@RequestBody FieldResponse e){ return new ResponseEntity<>(service.create(e), HttpStatus.CREATED);}
  @GetMapping public ResponseEntity<List<FieldResponse>> getAll(){ return ResponseEntity.ok(service.getAll());}
  @GetMapping("/{id}") public ResponseEntity<FieldResponse> getById(@PathVariable Long id){ return ResponseEntity.ok(service.getById(id));}
  @PutMapping("/{id}") public ResponseEntity<FieldResponse> update(@PathVariable Long id,@RequestBody FieldResponse e){ return ResponseEntity.ok(service.update(id,e));}
  @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){ service.delete(id); return ResponseEntity.noContent().build();}
}
