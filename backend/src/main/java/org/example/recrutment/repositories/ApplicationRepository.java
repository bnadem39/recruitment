package org.example.recrutment.repositories;

import org.example.recrutment.entities.application.Application;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, Long> {}
