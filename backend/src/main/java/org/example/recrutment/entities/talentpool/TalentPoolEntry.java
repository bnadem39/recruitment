package org.example.recrutment.entities.talentpool;

import jakarta.persistence.*;
import lombok.*;
import org.example.recrutment.entities.users.Candidates;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "talent_pool_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TalentPoolEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidates candidate;

    @Column(nullable = false, length = 255)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String skills;

    private Boolean consentGiven;
    private LocalDate consentDate;
    private LocalDate consentExpirationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TalentPoolStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
