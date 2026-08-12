package org.example.recrutment.dto.gestionOffres;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.gestionOffres.ContactType;
import org.example.recrutment.entities.gestionOffres.OfferStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobOfferResponseDTO {

    private Long id;
    private String title;
    private String description;
    private String department;
    private ContactType contractType;
    private String location;
    private Integer numberOfPositions;
    private LocalDate publicationDate;
    private LocalDate deadline;
    private OfferStatus status;
    private Long formId;
    private Boolean openForApplications;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
