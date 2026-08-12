package org.example.recrutment.services.gestionEntretiens;

import org.example.recrutment.dto.gestionEntretiens.InterviewRequestDTO;
import org.example.recrutment.dto.gestionEntretiens.InterviewResponseDTO;

import java.util.List;

public interface InterviewService {

    InterviewResponseDTO create(InterviewRequestDTO request);

    InterviewResponseDTO getById(Long id);

    List<InterviewResponseDTO> getAll();

    List<InterviewResponseDTO> getAllByApplication(Long applicationId);

    InterviewResponseDTO update(Long id, InterviewRequestDTO request);

    void delete(Long id);
}
