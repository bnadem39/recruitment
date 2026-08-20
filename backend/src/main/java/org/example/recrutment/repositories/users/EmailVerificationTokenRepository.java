package org.example.recrutment.repositories.users;

import org.example.recrutment.entities.users.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findTopByUser_EmailIgnoreCaseAndCodeHashAndUsedAtIsNullOrderByCreatedAtDesc(String email, String codeHash);
    List<EmailVerificationToken> findByUser_EmailIgnoreCaseAndUsedAtIsNull(String email);
}
