package org.example.recrutment.services.candidatures;

import org.example.recrutment.entities.users.Candidates;

import java.util.List;

public interface CandidatesService {
    Candidates create(Candidates candidate);

    Candidates update(Long id, Candidates candidate);

    Candidates getById(Long id);

    List<Candidates> getAll();

    void delete(Long id);
}
