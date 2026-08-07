package org.example.recrutment.dto.formulairesAdaptatifs;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Données envoyées par le client (admin RH) pour créer ou modifier un Form.
 * Ne contient volontairement pas d'id, createdAt, updatedAt : ce sont des
 * informations gérées côté serveur, jamais fournies par le client.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormRequestDTO {

    @NotBlank(message = "Le titre du formulaire est obligatoire")
    private String title;

    private String description;

    private Boolean active;
}
