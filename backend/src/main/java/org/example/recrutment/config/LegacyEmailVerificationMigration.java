package org.example.recrutment.config;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.repositories.users.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Keeps accounts created before the email-verification feature usable.
 *
 * New accounts are created with {@code emailVerified = false}, so they still
 * must complete verification before they can sign in.
 */
@Component
@Order(0)
@RequiredArgsConstructor
public class LegacyEmailVerificationMigration implements ApplicationRunner {

    private final UserRepository users;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        users.verifyLegacyAccounts();
    }
}
