package org.example.recrutment.services.talentPool;

import org.example.recrutment.entities.talentpool.TalentPoolEntry;
import java.util.List;
public interface TalentPoolEntryService { TalentPoolEntry create(TalentPoolEntry e); TalentPoolEntry update(Long id, TalentPoolEntry e); TalentPoolEntry getById(Long id); List<TalentPoolEntry> getAll(); void delete(Long id); }
