package org.example.recrutment.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.talentpool.TalentPoolEntry;
import org.example.recrutment.repositories.talentPool.TalentPoolEntryRepository;
import org.example.recrutment.services.talentPool.TalentPoolEntryService;
import org.springframework.stereotype.Service;
import java.util.List;
@Service @RequiredArgsConstructor
public class TalentPoolEntryServiceImpl implements TalentPoolEntryService {
  private final TalentPoolEntryRepository repo;
  public TalentPoolEntry create(TalentPoolEntry e){ return repo.save(e);} public TalentPoolEntry update(Long id, TalentPoolEntry e){var c=getById(id); c.setCandidate(e.getCandidate()); c.setCategory(e.getCategory()); c.setSkills(e.getSkills()); c.setConsentGiven(e.getConsentGiven()); c.setConsentDate(e.getConsentDate()); c.setConsentExpirationDate(e.getConsentExpirationDate()); c.setStatus(e.getStatus()); c.setNotes(e.getNotes()); return repo.save(c);} public TalentPoolEntry getById(Long id){ return repo.findById(id).orElseThrow(()->new org.example.recrutment.shared.exceptions.ResourceNotFoundException("TalentPoolEntry introuvable avec l'id "+id));} public List<TalentPoolEntry> getAll(){ return repo.findAll(); } public void delete(Long id){ repo.delete(getById(id)); }
}
