package org.example.recrutment.services.candidatures;

import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository repository;

    public ApplicationServiceImpl(ApplicationRepository repository) {
        this.repository = repository;
    }

    @Override
    public Application create(Application application) {
        application.setId(null);
        return repository.save(application);
    }

    @Override
    public Application update(Long id, Application application) {
        Application existing = getById(id);
        existing.setStatus(application.getStatus());
        existing.setCurrentStage(application.getCurrentStage());
        existing.setSubmittedAt(application.getSubmittedAt());
        existing.setFinalDecision(application.getFinalDecision());
        existing.setRejectionReason(application.getRejectionReason());
        existing.setWithdrawalReason(application.getWithdrawalReason());
        existing.setCandidate(application.getCandidate());
        existing.setJobOffer(application.getJobOffer());
        existing.setFieldResponses(application.getFieldResponses());
        existing.setDocuments(application.getDocuments());
        return repository.save(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public Application getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found with id " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Application> getAll() {
        return repository.findAll();
    }

    @Override
    public void delete(Long id) {
        repository.delete(getById(id));
    }
}
