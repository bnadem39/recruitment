package org.example.recrutment.repositories.complaints;

import org.example.recrutment.entities.complaints.Complaint;
import org.example.recrutment.entities.complaints.ComplaintCategory;
import org.example.recrutment.entities.complaints.ComplaintStatus;
import org.example.recrutment.entities.users.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findAllByOrderByCreatedAtDesc();
    List<Complaint> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Complaint> findByIdAndUserId(Long id, Long userId);
    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);
    List<Complaint> findByCategoryOrderByCreatedAtDesc(ComplaintCategory category);
    List<Complaint> findByUser_UserRoleOrderByCreatedAtDesc(UserRole role);
}
