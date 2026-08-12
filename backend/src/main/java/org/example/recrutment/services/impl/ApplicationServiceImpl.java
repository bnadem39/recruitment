package org.example.recrutment.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.application.Application;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.example.recrutment.services.candidatures.ApplicationService;
import org.springframework.stereotype.Service;
import java.util.List;
@Service @RequiredArgsConstructor
public class ApplicationServiceImpl extends CrudSupport implements ApplicationService {
  private final ApplicationRepository repo;
  public Application create(Application e){ return repo.save(e);} public Application update(Long id, Application e){var c=getById(id); c.setCandidate(e.getCandidate()); c.setStatus(e.getStatus()); c.setCurrentStage(e.getCurrentStage()); c.setSubmittedAt(e.getSubmittedAt()); c.setUpdatedAtDate(e.getUpdatedAtDate()); c.setFinalDecisionAt(e.getFinalDecisionAt()); c.setFinalDecision(e.getFinalDecision()); c.setRejectionReason(e.getRejectionReason()); c.setWithdrawalReason(e.getWithdrawalReason()); return repo.save(c);} public Application getById(Long id){ return repo.findById(id).orElseThrow(()->new org.example.recrutment.shared.exceptions.ResourceNotFoundException("Application introuvable avec l'id "+id));} public List<Application> getAll(){ return repo.findAll(); } public void delete(Long id){ repo.delete(getById(id)); }
}
