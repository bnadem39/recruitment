package org.example.recrutment.repositories.candidatures;

import org.example.recrutment.entities.application.Application;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, Long> {}
