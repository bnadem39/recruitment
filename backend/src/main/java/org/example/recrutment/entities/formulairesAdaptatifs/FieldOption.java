package org.example.recrutment.entities.formulairesAdaptatifs;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "field_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class FieldOption {

    // ==================== Identifiant ====================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== Attributs ====================

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private String value;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    // ==================== Relations ====================

}