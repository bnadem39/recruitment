package org.example.recrutment.entities.users;


// ===============================
// IMPORTS
// ===============================

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.List;

import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.talentPoolEtSuivi.TalentPoolEntry;


// ===============================
// ENTITÉ CANDIDATE
// ===============================




@Entity
@Table(name = "candidates")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder

public class Candidates extends Users {

    // ===============================
    // INFORMATIONS PERSONNELLES
    // ===============================

    // Date de naissance
    private LocalDate birthDate;

    // Adresse
    @Column(length = 255)
    private String address;


    // Code postal
    @Column(length = 20)
    private String postalCode;

    // Nationalité
    @Column(length = 100)
    private String nationality;

    // Sexe
    @Column(length = 20)
    private String gender;



    // ===============================
    // RÉSEAUX PROFESSIONNELS
    // ===============================

    private String linkedinUrl;

    private String portfolioUrl;


    // ===============================
    // PROFIL COMPLÉTÉ
    // ===============================

    /*
        Permet de savoir si le candidat
        a terminé de remplir son profil.
    */

    private Boolean profileCompleted = false;

    @OneToMany(mappedBy = "candidate")
    private List<Application> applications;

    @OneToMany(mappedBy = "candidate")
    private List<TalentPoolEntry> talentPoolEntries;

}
