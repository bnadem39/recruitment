package org.example.recrutment.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.application.FieldResponse;
import org.example.recrutment.repositories.candidatures.FieldResponseRepository;
import org.example.recrutment.services.candidatures.FieldResponseService;
import org.springframework.stereotype.Service;
import java.util.List;
@Service @RequiredArgsConstructor
public class FieldResponseServiceImpl implements FieldResponseService {
  private final FieldResponseRepository repo;
  public FieldResponse create(FieldResponse e){ return repo.save(e);} public FieldResponse update(Long id, FieldResponse e){var c=getById(id); c.setApplication(e.getApplication()); c.setFieldName(e.getFieldName()); c.setTextValue(e.getTextValue()); c.setDateValue(e.getDateValue()); c.setNumberValue(e.getNumberValue()); c.setBooleanValue(e.getBooleanValue()); return repo.save(c);} public FieldResponse getById(Long id){ return repo.findById(id).orElseThrow(()->new org.example.recrutment.shared.exceptions.ResourceNotFoundException("FieldResponse introuvable avec l'id "+id));} public List<FieldResponse> getAll(){ return repo.findAll(); } public void delete(Long id){ repo.delete(getById(id)); }
}
