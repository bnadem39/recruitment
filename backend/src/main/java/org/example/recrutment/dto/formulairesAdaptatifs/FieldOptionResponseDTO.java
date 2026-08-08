package org.example.recrutment.dto.formulairesAdaptatifs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldOptionResponseDTO {

    private Long id;
    private Long fieldId;
    private String label;
    private String value;
    private Integer displayOrder;
}