package org.example.recrutment.controllers;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.talentpool.TalentPoolEntry;
import org.example.recrutment.services.TalentPoolEntryService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/talent-pool-entries") @RequiredArgsConstructor
public class TalentPoolEntryController {
  private final TalentPoolEntryService service;
  @PostMapping public ResponseEntity<TalentPoolEntry> create(@RequestBody TalentPoolEntry e){ return new ResponseEntity<>(service.create(e), HttpStatus.CREATED);}
  @GetMapping public ResponseEntity<List<TalentPoolEntry>> getAll(){ return ResponseEntity.ok(service.getAll());}
  @GetMapping("/{id}") public ResponseEntity<TalentPoolEntry> getById(@PathVariable Long id){ return ResponseEntity.ok(service.getById(id));}
  @PutMapping("/{id}") public ResponseEntity<TalentPoolEntry> update(@PathVariable Long id,@RequestBody TalentPoolEntry e){ return ResponseEntity.ok(service.update(id,e));}
  @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){ service.delete(id); return ResponseEntity.noContent().build();}
}
