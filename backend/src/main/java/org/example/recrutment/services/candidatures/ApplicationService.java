package org.example.recrutment.services.candidatures;

import org.example.recrutment.entities.candidatures.Application;

import java.util.List;

public interface ApplicationService {
    Application create(Application application);
    Application update(Long id, Application application);
    Application getById(Long id);
    List<Application> getAll();
    void delete(Long id);
}
