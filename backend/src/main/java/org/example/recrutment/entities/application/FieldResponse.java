package org.example.recrutment.entities.application;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "field_responses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldResponse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(nullable = false, length = 255)
    private String fieldName;

    @Column(columnDefinition = "TEXT")
    private String textValue;

    @Column(columnDefinition = "TEXT")
    private String dateValue;

    @Column(columnDefinition = "TEXT")
    private String numberValue;

    @Column(columnDefinition = "TEXT")
    private String booleanValue;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
