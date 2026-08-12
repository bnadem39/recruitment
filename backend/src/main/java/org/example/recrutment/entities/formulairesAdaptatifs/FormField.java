package org.example.recrutment.entities.formulairesAdaptatifs;

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

import org.example.recrutment.entities.candidatures.FieldResponse;

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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "formId", nullable = false)
    private Form form;

    @OneToMany(mappedBy = "formField", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FieldOption> options = new ArrayList<>();

    @OneToMany(mappedBy = "sourceField")
    private List<FieldCondition> sourceConditions = new ArrayList<>();

    @OneToMany(mappedBy = "targetField")
    private List<FieldCondition> targetConditions = new ArrayList<>();

    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FieldResponse> responses = new ArrayList<>();

    // ==================== Méthodes utilitaires ====================

    public void addOption(FieldOption option) {
        options.add(option);
        option.setFormField(this);
    }

    public void removeOption(FieldOption option) {
        options.remove(option);
        option.setFormField(null);
    }

}
