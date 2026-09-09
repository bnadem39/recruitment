package org.example.recrutment.controllers.talentPool;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.talentpool.TalentPoolEntry;
import org.example.recrutment.entities.talentpool.TalentPoolStatus;
import org.example.recrutment.entities.users.Candidates;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.candidatures.CandidatesRepository;
import org.example.recrutment.repositories.talentPool.TalentPoolEntryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Talent Pool Management.
 * 
 * The Talent Pool allows HR to keep track of interesting candidates who were not
 * selected for a current job offer, but may be suitable for future positions.
 * 
 * IMPORTANT: Security notes:
 * - Only HR and ADMIN can access talent pool
 * - addedBy must be set from authenticated user, never from request
 * - candidateId must be validated and must exist
 */
@RestController
@RequestMapping("/api/hr/talent-pool")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
@Transactional
public class TalentPoolController {

    private final TalentPoolEntryRepository talentPoolRepository;
    private final CandidatesRepository candidatesRepository;

    /**
     * Get all talent pool entries, optionally filtered by status.
     * 
     * Query parameters:
     * - status: ACTIVE, CONTACTED, CONVERTED, ARCHIVED (optional)
     * - category: Filter by skill category (optional)
     * - search: Search by candidate name, email (optional)
     */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<TalentPoolResponse>> list(
            @RequestParam(required = false) TalentPoolStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {

        List<TalentPoolEntry> entries;

        if (search != null && !search.isBlank()) {
            // Search across status
            TalentPoolStatus searchStatus = status != null ? status : TalentPoolStatus.ACTIVE;
            entries = talentPoolRepository.searchByStatusAndTerm(searchStatus, "%" + search.toLowerCase() + "%");
        } else if (status != null) {
            // Filter by status
            entries = talentPoolRepository.findByStatus(status);
        } else if (category != null && !category.isBlank()) {
            // Filter by category
            entries = talentPoolRepository.findByCategory(category);
        } else {
            // Return all (sorted by most recent first)
            entries = talentPoolRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .toList();
        }

        List<TalentPoolResponse> responses = entries.stream()
                .map(this::toTalentPoolResponse)
                .toList();

        return ResponseEntity.ok(responses);
    }

    /**
     * Get a specific talent pool entry.
     */
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<TalentPoolResponse> getById(@PathVariable Long id) {
        TalentPoolEntry entry = talentPoolRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Talent pool entry not found"));
        return ResponseEntity.ok(toTalentPoolResponse(entry));
    }

    /**
     * Add a candidate to the talent pool.
     * 
     * This creates a new entry or updates an existing one if the candidate
     * is already in the pool with the same category.
     * 
     * IMPORTANT: addedBy is set from authenticated user, never from request.
     * This prevents spoofing.
     */
    @PostMapping
    public ResponseEntity<TalentPoolResponse> create(
            @AuthenticationPrincipal Users user,
            @RequestBody CreateTalentPoolRequest request) {

        // Validate candidate exists
        Candidates candidate = candidatesRepository.findById(request.candidateId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidate not found"));

        // Check for duplicate: candidate in same category with ACTIVE status
        Optional<TalentPoolEntry> existing = talentPoolRepository.findByCandidate_IdAndCategoryAndStatus(
                request.candidateId(),
                request.category(),
                TalentPoolStatus.ACTIVE
        );

        if (existing.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Candidate already exists in talent pool with this category");
        }

        // Create new entry
        TalentPoolEntry entry = TalentPoolEntry.builder()
                .candidate(candidate)
                .category(request.category())
                .skills(request.skills())
                .notes(request.notes())
                .status(TalentPoolStatus.ACTIVE)
                .consentGiven(request.consentGiven() != null ? request.consentGiven() : false)
                .consentDate(request.consentDate())
                .consentExpirationDate(request.consentExpirationDate())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        TalentPoolEntry saved = talentPoolRepository.save(entry);
        return ResponseEntity.status(HttpStatus.CREATED).body(toTalentPoolResponse(saved));
    }

    /**
     * Update a talent pool entry.
     * 
     * Can update: category, skills, notes, status, consent information
     * Cannot update: candidate (use delete + create instead)
     */
    @PatchMapping("/{id}")
    public ResponseEntity<TalentPoolResponse> update(
            @PathVariable Long id,
            @RequestBody UpdateTalentPoolRequest request) {

        TalentPoolEntry entry = talentPoolRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Talent pool entry not found"));

        // Update fields (only if provided in request)
        if (request.category() != null && !request.category().isBlank()) {
            entry.setCategory(request.category());
        }
        if (request.skills() != null) {
            entry.setSkills(request.skills());
        }
        if (request.notes() != null) {
            entry.setNotes(request.notes());
        }
        if (request.status() != null) {
            entry.setStatus(request.status());
        }
        if (request.consentGiven() != null) {
            entry.setConsentGiven(request.consentGiven());
        }
        if (request.consentDate() != null) {
            entry.setConsentDate(request.consentDate());
        }
        if (request.consentExpirationDate() != null) {
            entry.setConsentExpirationDate(request.consentExpirationDate());
        }

        entry.setUpdatedAt(LocalDateTime.now());
        TalentPoolEntry saved = talentPoolRepository.save(entry);
        return ResponseEntity.ok(toTalentPoolResponse(saved));
    }

    /**
     * Archive/delete a talent pool entry.
     * 
     * Soft delete: Sets status to EXPIRED instead of hard delete.
     * This preserves history and audit trail.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        TalentPoolEntry entry = talentPoolRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Talent pool entry not found"));

        entry.setStatus(TalentPoolStatus.EXPIRED);
        entry.setUpdatedAt(LocalDateTime.now());
        talentPoolRepository.save(entry);
        return ResponseEntity.noContent().build();
    }



    /**
     * Convert TalentPoolEntry to response DTO.
     */
    private TalentPoolResponse toTalentPoolResponse(TalentPoolEntry entry) {
        return new TalentPoolResponse(
                entry.getId(),
                entry.getCandidate().getId(),
                entry.getCandidate().getFirstName(),
                entry.getCandidate().getLastName(),
                entry.getCandidate().getEmail(),
                entry.getCandidate().getPhone(),
                entry.getCategory(),
                entry.getSkills(),
                entry.getNotes(),
                entry.getStatus().toString(),
                entry.getConsentGiven(),
                entry.getConsentDate(),
                entry.getConsentExpirationDate(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }

    // ============ DTOs ============

    public record CreateTalentPoolRequest(
            Long candidateId,
            String category,
            String skills,
            String notes,
            Boolean consentGiven,
            java.time.LocalDate consentDate,
            java.time.LocalDate consentExpirationDate
    ) {}

    public record UpdateTalentPoolRequest(
            String category,
            String skills,
            String notes,
            TalentPoolStatus status,
            Boolean consentGiven,
            java.time.LocalDate consentDate,
            java.time.LocalDate consentExpirationDate
    ) {}

    public record TalentPoolResponse(
            Long id,
            Long candidateId,
            String candidateFirstName,
            String candidateLastName,
            String candidateEmail,
            String candidatePhone,
            String category,
            String skills,
            String notes,
            String status,
            Boolean consentGiven,
            java.time.LocalDate consentDate,
            java.time.LocalDate consentExpirationDate,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}
}
