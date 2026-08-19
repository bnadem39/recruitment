package org.example.recrutment.services.candidatures;

import org.example.recrutment.dto.candidatures.ApplicationRequestDTO;
import org.example.recrutment.dto.candidatures.ApplicationResponseDTO;
import java.util.List;
public interface ApplicationService {
    ApplicationResponseDTO create(ApplicationRequestDTO request);
    ApplicationResponseDTO update(Long id, ApplicationRequestDTO request);
    ApplicationResponseDTO getById(Long id);
    List<ApplicationResponseDTO> getAll();
    List<ApplicationResponseDTO> getAllByCandidate(Long candidateId);
    List<ApplicationResponseDTO> getAllByJobOffer(Long jobOfferId);
    void delete(Long id);
}
