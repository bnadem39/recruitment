package org.example.recrutment.services;

import org.example.recrutment.entities.application.Application;
import java.util.List;
public interface ApplicationService { Application create(Application e); Application update(Long id, Application e); Application getById(Long id); List<Application> getAll(); void delete(Long id); }
