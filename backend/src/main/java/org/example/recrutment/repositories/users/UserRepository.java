package org.example.recrutment.repositories.users;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
public interface UserRepository extends JpaRepository<Users, Long>, JpaSpecificationExecutor<Users> {
    Optional<Users> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUserRole(UserRole role);
    List<Users> findByUserRoleOrderByFirstNameAscLastNameAsc(UserRole role);

    /**
     * Accounts created before email verification was introduced have a null
     * flag. New accounts are always saved with an explicit false value.
     */
    @Modifying
    @Query("update Users user set user.emailVerified = true where user.emailVerified is null")
    int verifyLegacyAccounts();
}
