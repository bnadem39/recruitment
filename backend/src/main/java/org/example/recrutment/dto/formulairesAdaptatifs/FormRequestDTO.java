package org.example.recrutment.dto.formulairesAdaptatifs;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;


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

    @Builder.Default
    private List<Long> jobOfferIds = new ArrayList<>();
}