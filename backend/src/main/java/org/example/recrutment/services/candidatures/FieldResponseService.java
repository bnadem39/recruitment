package org.example.recrutment.services.candidatures;

import org.example.recrutment.entities.application.FieldResponse;
import java.util.List;
public interface FieldResponseService { FieldResponse create(FieldResponse e); FieldResponse update(Long id, FieldResponse e); FieldResponse getById(Long id); List<FieldResponse> getAll(); void delete(Long id); }
