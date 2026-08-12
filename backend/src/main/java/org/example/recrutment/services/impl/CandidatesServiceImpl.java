package org.example.recrutment.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.users.Candidates;
import org.example.recrutment.repositories.CandidatesRepository;
import org.example.recrutment.services.CandidatesService;
import org.example.recrutment.shared.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CandidatesServiceImpl implements CandidatesService {

    private final CandidatesRepository candidatesRepository;

    @Override
    public Candidates create(Candidates candidate) {
        return candidatesRepository.save(candidate);
    }

    @Override
    public Candidates update(Long id, Candidates candidate) {
        Candidates existingCandidate = getById(id);

        existingCandidate.setFirstName(candidate.getFirstName());
        existingCandidate.setLastName(candidate.getLastName());
        existingCandidate.setEmail(candidate.getEmail());
        existingCandidate.setPassword(candidate.getPassword());
        existingCandidate.setPhone(candidate.getPhone());
        existingCandidate.setUserRole(candidate.getUserRole());
        existingCandidate.setStatus(candidate.getStatus());

        existingCandidate.setBirthDate(candidate.getBirthDate());
        existingCandidate.setAddress(candidate.getAddress());
        existingCandidate.setPostalCode(candidate.getPostalCode());
        existingCandidate.setNationality(candidate.getNationality());
        existingCandidate.setGender(candidate.getGender());
        existingCandidate.setLinkedinUrl(candidate.getLinkedinUrl());
        existingCandidate.setPortfolioUrl(candidate.getPortfolioUrl());
        existingCandidate.setProfileCompleted(candidate.getProfileCompleted());

        return candidatesRepository.save(existingCandidate);
    }

    @Override
    public Candidates getById(Long id) {
        return candidatesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate introuvable avec l'id " + id));
    }

    @Override
    public List<Candidates> getAll() {
        return candidatesRepository.findAll();
    }

    @Override
    public void delete(Long id) {
        Candidates candidate = getById(id);
        candidatesRepository.delete(candidate);
    }
}
