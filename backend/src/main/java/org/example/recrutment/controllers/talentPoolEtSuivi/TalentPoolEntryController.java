package org.example.recrutment.controllers.talentPoolEtSuivi;

import org.example.recrutment.entities.talentPoolEtSuivi.TalentPoolEntry;
import org.example.recrutment.services.talentPoolEtSuivi.TalentPoolEntryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/talent-pool-entries")
public class TalentPoolEntryController {

    private final TalentPoolEntryService service;

    public TalentPoolEntryController(TalentPoolEntryService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TalentPoolEntry> create(@RequestBody TalentPoolEntry entry) {
        return ResponseEntity.ok(service.create(entry));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TalentPoolEntry> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<TalentPoolEntry>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TalentPoolEntry> update(@PathVariable Long id, @RequestBody TalentPoolEntry entry) {
        return ResponseEntity.ok(service.update(id, entry));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
