package org.example.recrutment.controllers.complaints;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.recrutment.dto.complaints.*;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.services.complaints.ComplaintService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {
    private final ComplaintService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ComplaintResponse create(@AuthenticationPrincipal Users user, @Valid @RequestBody CreateComplaintRequest request) { return service.createComplaint(user, request); }

    @GetMapping("/my")
    public List<ComplaintResponse> mine(@AuthenticationPrincipal Users user) { return service.getMyComplaints(user); }

    @GetMapping("/my/{id}")
    public ComplaintResponse mineById(@AuthenticationPrincipal Users user, @PathVariable Long id) { return service.getMyComplaintById(user, id); }
}
