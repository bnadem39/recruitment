package org.example.recrutment.controllers.complaints;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.recrutment.dto.complaints.*;
import org.example.recrutment.entities.complaints.ComplaintCategory;
import org.example.recrutment.entities.complaints.ComplaintStatus;
import org.example.recrutment.entities.users.UserRole;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.services.complaints.ComplaintService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/complaints")
@RequiredArgsConstructor
public class AdminComplaintController {
    private final ComplaintService service;

    @GetMapping
    public List<AdminComplaintResponse> all(@RequestParam(required = false) ComplaintStatus status, @RequestParam(required = false) ComplaintCategory category, @RequestParam(required = false) UserRole role) { return service.getAllComplaints(status, category, role); }
    @GetMapping("/{id}")
    public AdminComplaintResponse byId(@PathVariable Long id) { return service.getComplaintById(id); }
    @PostMapping("/{id}/response")
    public AdminComplaintResponse response(@PathVariable Long id, @AuthenticationPrincipal Users admin, @Valid @RequestBody ComplaintResponseRequest request) { return service.respondToComplaint(id, admin, request); }
    @PatchMapping("/{id}/status")
    public AdminComplaintResponse status(@PathVariable Long id, @Valid @RequestBody UpdateComplaintStatusRequest request) { return service.updateStatus(id, request.status()); }
}
