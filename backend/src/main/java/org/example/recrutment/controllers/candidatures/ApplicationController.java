package org.example.recrutment.controllers.candidatures;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.example.recrutment.dto.candidatures.ApplicationRequestDTO;
import org.example.recrutment.dto.candidatures.ApplicationResponseDTO;
import org.example.recrutment.services.candidatures.ApplicationService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/applications") @RequiredArgsConstructor
public class ApplicationController {
  private final ApplicationService service;
  @PostMapping public ResponseEntity<ApplicationResponseDTO> create(@Valid @RequestBody ApplicationRequestDTO e){ return new ResponseEntity<>(service.create(e), HttpStatus.CREATED);}
  @GetMapping public ResponseEntity<List<ApplicationResponseDTO>> getAll(){ return ResponseEntity.ok(service.getAll());}
  @GetMapping("/{id}") public ResponseEntity<ApplicationResponseDTO> getById(@PathVariable Long id){ return ResponseEntity.ok(service.getById(id));}
  @GetMapping("/candidate/{id}") public ResponseEntity<List<ApplicationResponseDTO>> byCandidate(@PathVariable Long id){ return ResponseEntity.ok(service.getAllByCandidate(id));}
  @GetMapping("/job-offer/{id}") public ResponseEntity<List<ApplicationResponseDTO>> byJobOffer(@PathVariable Long id){ return ResponseEntity.ok(service.getAllByJobOffer(id));}
  @PutMapping("/{id}") public ResponseEntity<ApplicationResponseDTO> update(@PathVariable Long id,@Valid @RequestBody ApplicationRequestDTO e){ return ResponseEntity.ok(service.update(id,e));}
  @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){ service.delete(id); return ResponseEntity.noContent().build();}
}
