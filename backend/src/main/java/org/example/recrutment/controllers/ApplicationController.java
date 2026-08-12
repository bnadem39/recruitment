package org.example.recrutment.controllers;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.application.Application;
import org.example.recrutment.services.ApplicationService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/applications") @RequiredArgsConstructor
public class ApplicationController {
  private final ApplicationService service;
  @PostMapping public ResponseEntity<Application> create(@RequestBody Application e){ return new ResponseEntity<>(service.create(e), HttpStatus.CREATED);}
  @GetMapping public ResponseEntity<List<Application>> getAll(){ return ResponseEntity.ok(service.getAll());}
  @GetMapping("/{id}") public ResponseEntity<Application> getById(@PathVariable Long id){ return ResponseEntity.ok(service.getById(id));}
  @PutMapping("/{id}") public ResponseEntity<Application> update(@PathVariable Long id,@RequestBody Application e){ return ResponseEntity.ok(service.update(id,e));}
  @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){ service.delete(id); return ResponseEntity.noContent().build();}
}
