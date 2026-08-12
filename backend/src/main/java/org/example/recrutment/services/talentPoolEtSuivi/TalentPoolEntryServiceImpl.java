package org.example.recrutment.services.talentPoolEtSuivi;

import org.example.recrutment.entities.talentPoolEtSuivi.TalentPoolEntry;
import org.example.recrutment.repositories.talentPoolEtSuivi.TalentPoolEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class TalentPoolEntryServiceImpl implements TalentPoolEntryService {

    private final TalentPoolEntryRepository repository;

    public TalentPoolEntryServiceImpl(TalentPoolEntryRepository repository) {
        this.repository = repository;
    }

    @Override
    public TalentPoolEntry create(TalentPoolEntry entry) {
        entry.setId(null);
        if (entry.getCreatedAt() == null) {
            entry.setCreatedAt(LocalDateTime.now());
        }
        return repository.save(entry);
    }

    @Override
    public TalentPoolEntry update(Long id, TalentPoolEntry entry) {
        TalentPoolEntry existing = getById(id);
        existing.setCategory(entry.getCategory());
        existing.setSkills(entry.getSkills());
        existing.setConsentGiven(entry.getConsentGiven());
        existing.setConsentDate(entry.getConsentDate());
        existing.setConsentExpirationDate(entry.getConsentExpirationDate());
        existing.setStatus(entry.getStatus());
        existing.setNotes(entry.getNotes());
        existing.setCandidate(entry.getCandidate());
        return repository.save(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public TalentPoolEntry getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("TalentPoolEntry not found with id " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TalentPoolEntry> getAll() {
        return repository.findAll();
    }

    @Override
    public void delete(Long id) {
        repository.delete(getById(id));
    }
}
