package org.example.recrutment.services.formulairesAdaptatifs;

import org.example.recrutment.dto.formulairesAdaptatifs.FormRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FormResponseDTO;

import java.util.List;

public interface FormService {

    FormResponseDTO create(FormRequestDTO request);

    FormResponseDTO getById(Long id);

    List<FormResponseDTO> getAll();

    List<FormResponseDTO> getAllActive();

    FormResponseDTO update(Long id, FormRequestDTO request);

    void delete(Long id);
}
