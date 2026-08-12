package org.example.recrutment.services.talentPoolEtSuivi;

import org.example.recrutment.entities.talentPoolEtSuivi.TalentPoolEntry;

import java.util.List;

public interface TalentPoolEntryService {
    TalentPoolEntry create(TalentPoolEntry entry);
    TalentPoolEntry update(Long id, TalentPoolEntry entry);
    TalentPoolEntry getById(Long id);
    List<TalentPoolEntry> getAll();
    void delete(Long id);
}
