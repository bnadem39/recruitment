package org.example.recrutment.controllers;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.users.Candidates;
import org.example.recrutment.services.CandidatesService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidatesController {

    private final CandidatesService candidatesService;

    @PostMapping
    public ResponseEntity<Candidates> create(@RequestBody Candidates candidate) {
        return new ResponseEntity<>(candidatesService.create(candidate), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Candidates> getById(@PathVariable Long id) {
        return ResponseEntity.ok(candidatesService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<Candidates>> getAll() {
        return ResponseEntity.ok(candidatesService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Candidates> update(@PathVariable Long id, @RequestBody Candidates candidate) {
        return ResponseEntity.ok(candidatesService.update(id, candidate));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        candidatesService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
