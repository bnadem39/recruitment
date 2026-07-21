package org.example.recrutment.entities.users;

// ===============================
// IMPORTS
// ===============================

// Import de toutes les annotations JPA
import jakarta.persistence.*;

// Lombok génère automatiquement les getters, setters et constructeurs
import lombok.*;

// Gestion automatique des dates
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

// Type de données Date + Heure
import java.time.LocalDateTime;


// ===============================
// ENTITÉ USER
// ===============================

// Cette classe sera transformée en table dans la base de données
@Entity

// Nom de la table
@Table(name = "users")

// Gestion de l'héritage avec Candidate
@Inheritance(strategy = InheritanceType.JOINED)

// Lombok
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Users {

    // ===============================
    // IDENTIFIANT
    // ===============================

    // Clé primaire
    @Id

    // Auto-incrément
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // ===============================
    // INFORMATIONS PERSONNELLES
    // ===============================

    // Prénom obligatoire
    @Column(nullable = false, length = 100)
    private String firstName;

    // Nom obligatoire
    @Column(nullable = false, length = 100)
    private String lastName;


    // ===============================
    // AUTHENTIFICATION
    // ===============================

    // Email unique
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /*
        Ce champ contient le MOT DE PASSE HACHÉ.

        Exemple :
        $2a$10$9kFl....

        Il ne faut JAMAIS stocker :

        azerty123
        admin123
        password
    */
    @Column(nullable = false)
    private String password;


    // ===============================
    // CONTACT
    // ===============================

    @Column(length = 20)
    private String phone;


    // ===============================
    // RÔLE
    // ===============================

    /*
        ADMIN
        HR
        INTERVIEWER
        CANDIDATE
    */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole userRole;


    // ===============================
    // STATUT
    // ===============================

    /*
        ACTIVE
        BLOCKED
        DISABLED
    */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;


    // ===============================
    // AUDIT
    // ===============================

    // Date de création automatique
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;


    // Date de modification automatique
    @UpdateTimestamp
    private LocalDateTime updatedAt;

}
