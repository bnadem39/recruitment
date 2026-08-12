package org.example.recrutment.repositories.users;

import org.example.recrutment.entities.users.Users;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsersRepository extends JpaRepository<Users, Long> {
}
