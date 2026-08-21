package org.example.recrutment.config;
import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.users.*;
import org.example.recrutment.repositories.users.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
@Component @RequiredArgsConstructor
public class DefaultAdminInitializer implements ApplicationRunner {
    private final UserRepository users; private final PasswordEncoder passwords;
    @Override public void run(ApplicationArguments args) {
        if (!users.existsByUserRole(UserRole.ADMIN)) users.save(Users.builder().firstName("System").lastName("Administrator")
                .email("admin@gmail.com").password(passwords.encode("admin@26")).userRole(UserRole.ADMIN).status(UserStatus.ACTIVE).emailVerified(true).build());
    }
}
