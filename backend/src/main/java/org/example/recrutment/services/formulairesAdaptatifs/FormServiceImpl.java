package org.example.recrutment.services.formulairesAdaptatifs;

import org.example.recrutment.dto.formulairesAdaptatifs.FormRequestDTO;
import org.example.recrutment.dto.formulairesAdaptatifs.FormResponseDTO;
import org.example.recrutment.entities.formulairesAdaptatifs.Form;
import org.example.recrutment.exceptions.ResourceNotFoundException;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation de FormService.
 * Fait le pont entre les DTOs (couche API) et l'entité JPA Form (couche persistance).
 */
@Service
public class FormServiceImpl implements FormService {

    private final FormRepository formRepository;

    /**
     * Injection par constructeur (préférée à @Autowired sur un champ) :
     * rend les dépendances explicites et facilite les tests unitaires.
     */
    public FormServiceImpl(FormRepository formRepository) {
        this.formRepository = formRepository;
    }

    // ==================== Create ====================

    @Override
    @Transactional
    public FormResponseDTO create(FormRequestDTO request) {
        Form form = Form.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Form saved = formRepository.save(form);
        return toResponseDTO(saved);
    }

    // ==================== Read ====================

    @Override
    public FormResponseDTO getById(Long id) {
        Form form = findFormOrThrow(id);
        return toResponseDTO(form);
    }

    @Override
    public List<FormResponseDTO> getAll() {
        return formRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Override
    public List<FormResponseDTO> getAllActive() {
        return formRepository.findByActiveTrue()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // ==================== Update ====================

    @Override
    @Transactional
    public FormResponseDTO update(Long id, FormRequestDTO request) {
        Form form = findFormOrThrow(id);

        form.setTitle(request.getTitle());
        form.setDescription(request.getDescription());
        if (request.getActive() != null) {
            form.setActive(request.getActive());
        }

        Form updated = formRepository.save(form);
        return toResponseDTO(updated);
    }

    // ==================== Delete ====================

    @Override
    @Transactional
    public void delete(Long id) {
        Form form = findFormOrThrow(id);
        formRepository.delete(form);
    }

    // ==================== Méthodes utilitaires privées ====================

    private Form findFormOrThrow(Long id) {
        return formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Formulaire introuvable avec l'id : " + id));
    }

    /** Convertit l'entité Form en DTO exposé par l'API. */
    private FormResponseDTO toResponseDTO(Form form) {
        return FormResponseDTO.builder()
                .id(form.getFormId())
                .title(form.getTitle())
                .description(form.getDescription())
                .active(form.getActive())
                .createdAt(form.getCreatedAt())
                .updatedAt(form.getUpdatedAt())
                .build();
    }
}
