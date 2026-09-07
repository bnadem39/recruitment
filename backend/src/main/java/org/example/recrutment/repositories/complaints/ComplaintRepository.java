package org.example.recrutment.repositories.complaints;

import jakarta.transaction.Transactional;
import org.example.recrutment.entities.complaints.Complaint;
import org.example.recrutment.entities.complaints.ComplaintCategory;
import org.example.recrutment.entities.complaints.ComplaintStatus;
import org.example.recrutment.entities.users.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findAllByOrderByCreatedAtDesc();
    List<Complaint> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Complaint> findByIdAndUserId(Long id, Long userId);
    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);
    List<Complaint> findByCategoryOrderByCreatedAtDesc(ComplaintCategory category);
    List<Complaint> findByUser_UserRoleOrderByCreatedAtDesc(UserRole role);

    @Modifying
    @Transactional
    @Query("UPDATE Complaint c SET c.respondedBy = null WHERE c.respondedBy.id = :userId")
    void clearRespondedBy(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE Complaint c SET c.user = null WHERE c.user.id = :userId")
    void clearComplaintUser(Long userId);
}
