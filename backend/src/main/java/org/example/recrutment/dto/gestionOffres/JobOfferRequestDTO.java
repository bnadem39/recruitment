package org.example.recrutment.dto.gestionOffres;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.recrutment.entities.gestionOffres.ContactType;
import org.example.recrutment.entities.gestionOffres.OfferStatus;

import java.time.LocalDate;

/**
 * Données envoyées par l'admin RH pour créer ou modifier une offre.
 * formId référence le template de formulaire à utiliser pour cette offre
 * (le service vérifie que ce Form existe avant de créer l'offre).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobOfferRequestDTO {

    @NotBlank(message = "Le titre de l'offre est obligatoire")
    private String title;

    private String description;

    private String department;

    @NotNull(message = "Le type de contrat est obligatoire")
    private ContactType contractType;

    private String location;

    @Positive(message = "Le nombre de postes doit être positif")
    private Integer numberOfPositions;

    private LocalDate publicationDate;

    private LocalDate deadline;

    private OfferStatus status;

    @NotNull(message = "Le formulaire associé est obligatoire")
    private Long formId;
}
