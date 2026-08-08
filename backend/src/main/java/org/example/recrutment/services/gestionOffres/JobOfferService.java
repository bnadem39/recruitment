package org.example.recrutment.services.gestionOffres;

import org.example.recrutment.dto.gestionOffres.JobOfferRequestDTO;
import org.example.recrutment.dto.gestionOffres.JobOfferResponseDTO;
import org.example.recrutment.entities.gestionOffres.OfferStatus;

import java.util.List;

public interface JobOfferService {

    JobOfferResponseDTO create(JobOfferRequestDTO request);

    JobOfferResponseDTO getById(Long id);

    List<JobOfferResponseDTO> getAll();

    List<JobOfferResponseDTO> getAllByStatus(OfferStatus status);

    JobOfferResponseDTO update(Long id, JobOfferRequestDTO request);

    void delete(Long id);
}
