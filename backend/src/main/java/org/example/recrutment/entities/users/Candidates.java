package org.example.recrutment.entities.users;


// ===============================
// IMPORTS
// ===============================

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;


// ===============================
// ENTITÉ CANDIDATE
// ===============================




@Entity
@Table(name = "candidates")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Candidates extends User {

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

}