package org.example.recrutment.hr;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class HrEvaluatorController {
    private final HrEvaluatorService service;

    @GetMapping("/evaluators")
    public List<EvaluatorResponse> list() {
        return service.list();
    }

    @GetMapping("/offers/{offerId}/evaluators")
    public List<Long> assignedEvaluatorIds(@PathVariable Long offerId) {
        return service.assignedEvaluatorIds(offerId);
    }

    @PutMapping("/offers/{offerId}/evaluators")
    public List<Long> assign(@PathVariable Long offerId, @Valid @RequestBody EvaluatorAssignmentRequest request) {
        return service.assign(offerId, request.evaluatorIds());
    }
}
