package org.example.recrutement.entities.formulairesAdaptatifs;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import org.example.recrutment.entities.formulairesAdaptatifs.FieldType;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "form_fields")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class FormField {

    // ==================== Identifiant ====================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== Attributs de base ====================

    @Column(nullable = false)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(name = "field_type", nullable = false)
    private FieldType fieldType;

    @Column(nullable = false)
    @Builder.Default
    private Boolean required = false;

    private String placeholder;

    @Column(name = "default_visible", nullable = false)
    @Builder.Default
    private Boolean defaultVisible = true;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    // ==================== Règles de validation ====================

    @Column(name = "validation_rule")
    private String validationRule;

    @Column(name = "minimum_value")
    private BigDecimal minimumValue;

    @Column(name = "maximum_value")
    private BigDecimal maximumValue;

    @Column(name = "minimum_length")
    private Integer minimumLength;

    @Column(name = "maximum_length")
    private Integer maximumLength;

    // ==================== Relations ====================

}
