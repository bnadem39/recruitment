package org.example.recrutment.controllers.candidatures;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.candidatures.ApplicationDocument;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.hr.EvaluatorAssignmentRepository;
import org.example.recrutment.repositories.candidatures.ApplicationDocumentRepository;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * REST Controller for Evaluator document access.
 * 
 * Evaluators can only access documents for applications that are assigned to them
 * (i.e., applications for job offers where they are assigned as evaluators).
 * 
 * IMPORTANT: Security checks MUST verify:
 * 1. The document belongs to an application
 * 2. The evaluator is assigned to that application's job offer
 * 3. The user is authenticated and has EVALUATOR role
 */
@RestController
@RequestMapping("/api/evaluator/applications/{applicationId}/documents")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EVALUATOR')")
@Transactional(readOnly = true)
public class EvaluatorDocumentController {

    private final ApplicationDocumentRepository documentRepository;
    private final ApplicationRepository applicationRepository;
    private final EvaluatorAssignmentRepository assignmentRepository;

    /**
     * List all documents for an application that this evaluator is assigned to.
     * 
     * Security: Verifies evaluator is assigned to the application's job offer.
     * 
     * @param user The authenticated evaluator
     * @param applicationId The application ID
     * @return List of documents (metadata only, no file contents)
     * @throws 404 If application not found
     * @throws 403 If evaluator is not assigned to the job offer
     */
    @GetMapping
    public ResponseEntity<List<DocumentResponse>> listApplicationDocuments(
            @AuthenticationPrincipal Users user,
            @PathVariable Long applicationId) {

        // Step 1: Verify application exists
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

        // Step 2: Verify evaluator is assigned to this job offer (permission check)
        boolean isAssigned = assignmentRepository.findByEvaluatorIdWithOffer(user.getId()).stream()
                .anyMatch(assignment -> assignment.getOffer().getId().equals(application.getJobOffer().getId()));

        if (!isAssigned) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to this job offer");
        }

        // Step 3: Fetch and return documents
        List<ApplicationDocument> documents = documentRepository.findByApplication_Id(applicationId);
        List<DocumentResponse> responses = documents.stream()
                .map(this::toDocumentResponse)
                .toList();

        return ResponseEntity.ok(responses);
    }

    /**
     * Get a specific document for an application.
     * 
     * Security: Verifies the document belongs to an application assigned to this evaluator.
     * 
     * @param user The authenticated evaluator
     * @param applicationId The application ID
     * @param documentId The document ID
     * @return Document metadata (for preview/download purposes)
     * @throws 404 If application or document not found
     * @throws 403 If document doesn't belong to the application or evaluator not assigned
     */
    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentResponse> getDocument(
            @AuthenticationPrincipal Users user,
            @PathVariable Long applicationId,
            @PathVariable Long documentId) {

        // Step 1: Verify application exists
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

        // Step 2: Verify evaluator is assigned to this job offer
        boolean isAssigned = assignmentRepository.findByEvaluatorIdWithOffer(user.getId()).stream()
                .anyMatch(assignment -> assignment.getOffer().getId().equals(application.getJobOffer().getId()));

        if (!isAssigned) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not assigned to this job offer");
        }

        // Step 3: Verify document exists and belongs to this application
        ApplicationDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (!document.getApplication().getId().equals(applicationId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Document does not belong to this application");
        }

        // Step 4: Return document metadata
        return ResponseEntity.ok(toDocumentResponse(document));
    }

    /**
     * Convert ApplicationDocument entity to response DTO.
     * 
     * NOTE: This returns metadata only. Actual file download would require
     * a separate endpoint with file streaming logic.
     */
    private DocumentResponse toDocumentResponse(ApplicationDocument document) {
        return new DocumentResponse(
                document.getId(),
                document.getApplication().getId(),
                document.getOriginalName(),
                document.getMimeType(),
                document.getFileSize() != null ? String.valueOf(document.getFileSize()) : "0",
                document.getVerificationStatus().toString(),
                document.getRejectionReason(),
                document.getUploadedAt(),
                null
        );
    }

    /**
     * Response DTO for document metadata.
     * 
     * Contains information about a document without exposing file storage paths
     * or sensitive server-side details.
     */
    public record DocumentResponse(
            Long id,
            Long applicationId,
            String originalName,
            String mimeType,
            String fileSize,
            String verificationStatus,
            String rejectionReason,
            java.time.LocalDateTime uploadedAt,
            java.time.LocalDateTime createdAt
    ) {}
}
