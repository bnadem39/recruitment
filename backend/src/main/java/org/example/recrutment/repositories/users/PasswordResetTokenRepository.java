package org.example.recrutment.repositories.users;

import org.example.recrutment.entities.users.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(
            String tokenHash
    );

    void deleteByUser_Id(Long userId);
}