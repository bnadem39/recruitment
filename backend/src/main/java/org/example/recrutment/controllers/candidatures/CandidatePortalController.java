package org.example.recrutment.controllers.candidatures;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.candidatures.Application;
import org.example.recrutment.entities.candidatures.ApplicationStatus;
import org.example.recrutment.entities.candidatures.FieldResponse;
import org.example.recrutment.entities.candidatures.FinalDecision;
import org.example.recrutment.entities.candidatures.RecruitmentStage;
import org.example.recrutment.entities.formulairesAdaptatifs.ConditionAction;
import org.example.recrutment.entities.formulairesAdaptatifs.ConditionOperator;
import org.example.recrutment.entities.formulairesAdaptatifs.FieldType;
import org.example.recrutment.entities.gestionEntretiens.InterviewStatus;
import org.example.recrutment.entities.gestionEntretiens.InterviewType;
import org.example.recrutment.entities.gestionEntretiens.InterviewMode;
import org.example.recrutment.entities.gestionOffres.ContactType;
import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.gestionOffres.OfferStatus;
import org.example.recrutment.entities.users.Candidates;
import org.example.recrutment.entities.users.Users;
import org.example.recrutment.repositories.candidatures.ApplicationRepository;
import org.example.recrutment.repositories.candidatures.FieldResponseRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FieldConditionRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FieldOptionRepository;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormFieldRepository;
import org.example.recrutment.repositories.gestionEntretiens.InterviewRepository;
import org.example.recrutment.repositories.gestionOffres.JobOfferRepository;
import org.example.recrutment.repositories.users.CandidateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/candidate")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CANDIDATE')")
public class CandidatePortalController {
    private final CandidateRepository candidateRepository;
    private final JobOfferRepository jobOfferRepository;
    private final ApplicationRepository applicationRepository;
    private final FieldResponseRepository fieldResponseRepository;
    private final FormFieldRepository formFieldRepository;
    private final FieldOptionRepository fieldOptionRepository;
    private final FieldConditionRepository fieldConditionRepository;
    private final InterviewRepository interviewRepository;

    @GetMapping("/profile")
    public CandidateProfileResponse profile(@AuthenticationPrincipal Users user) {
        return toProfile(candidate(user));
    }

    @PutMapping("/profile")
    @Transactional
    public CandidateProfileResponse updateProfile(@AuthenticationPrincipal Users user, @RequestBody CandidateProfileRequest request) {
        Candidates candidate = candidate(user);
        if (request.firstName() != null) candidate.setFirstName(request.firstName());
        if (request.lastName() != null) candidate.setLastName(request.lastName());
        if (request.phone() != null) candidate.setPhone(request.phone());
        if (request.birthDate() != null) candidate.setBirthDate(request.birthDate());
        if (request.address() != null) candidate.setAddress(request.address());
        if (request.postalCode() != null) candidate.setPostalCode(request.postalCode());
        if (request.nationality() != null) candidate.setNationality(request.nationality());
        if (request.gender() != null) candidate.setGender(request.gender());
        if (request.linkedinUrl() != null) candidate.setLinkedinUrl(request.linkedinUrl());
        if (request.portfolioUrl() != null) candidate.setPortfolioUrl(request.portfolioUrl());
        return toProfile(candidateRepository.save(candidate));
    }

    @GetMapping("/job-offers")
    public List<JobOfferCandidateResponse> publishedOffers() {
        return jobOfferRepository.findByStatus(OfferStatus.PUBLISHED).stream()
                .filter(JobOffer::isOpenForApplications)
                .sorted(Comparator.comparing(JobOffer::getPublicationDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toOffer)
                .toList();
    }

    @GetMapping("/job-offers/{id}")
    public JobOfferCandidateResponse offer(@PathVariable Long id, @AuthenticationPrincipal Users user) {
        Candidates candidate = candidate(user);
        JobOffer offer = publishedOffer(id);
        boolean alreadyApplied = applicationRepository.existsByCandidate_IdAndJobOffer_Id(candidate.getId(), offer.getId());
        return toOffer(offer, alreadyApplied);
    }

    @GetMapping("/job-offers/{id}/form")
    public ApplicationFormResponse form(@PathVariable Long id) {
        JobOffer offer = publishedOffer(id);
        if (offer.getForm() == null || !Boolean.TRUE.equals(offer.getForm().getActive())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No active application form is attached to this offer");
        }
        Long formId = offer.getForm().getFormId();
        List<FormFieldCandidateResponse> fields = formFieldRepository.findByForm_FormIdOrderByDisplayOrderAsc(formId).stream()
                .map(field -> new FormFieldCandidateResponse(
                        field.getId(),
                        field.getLabel(),
                        field.getFieldType(),
                        field.getRequired(),
                        field.getPlaceholder(),
                        field.getDefaultVisible(),
                        field.getDisplayOrder(),
                        field.getValidationRule(),
                        field.getMinimumValue(),
                        field.getMaximumValue(),
                        field.getMinimumLength(),
                        field.getMaximumLength(),
                        fieldOptionRepository.findByFormField_IdOrderByDisplayOrderAsc(field.getId()).stream()
                                .map(option -> new FieldOptionCandidateResponse(option.getId(), option.getLabel(), option.getValue(), option.getDisplayOrder()))
                                .toList()))
                .toList();
        List<FieldConditionCandidateResponse> conditions = fieldConditionRepository.findByTargetField_Form_FormId(formId).stream()
                .map(condition -> new FieldConditionCandidateResponse(
                        condition.getId(),
                        condition.getSourceField().getId(),
                        condition.getTargetField().getId(),
                        condition.getOperator(),
                        condition.getExpectedValue(),
                        condition.getAction()))
                .toList();
        return new ApplicationFormResponse(formId, offer.getForm().getTitle(), offer.getForm().getDescription(), fields, conditions);
    }

    @GetMapping("/applications")
    public List<ApplicationCandidateResponse> applications(@AuthenticationPrincipal Users user) {
        Candidates candidate = candidate(user);
        return applicationRepository.findByCandidate_Id(candidate.getId()).stream()
                .sorted(Comparator.comparing(Application::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toApplication)
                .toList();
    }

    @GetMapping("/applications/{id}")
    public ApplicationDetailResponse application(@PathVariable Long id, @AuthenticationPrincipal Users user) {
        Candidates candidate = candidate(user);
        Application application = ownApplication(id, candidate.getId());
        return new ApplicationDetailResponse(toApplication(application), fieldResponseRepository.findByApplication_Id(id).stream().map(this::toFieldResponse).toList());
    }

    @PostMapping("/job-offers/{id}/submit")
    @Transactional
    public ApplicationSubmissionResponse submit(@PathVariable Long id, @AuthenticationPrincipal Users user, @RequestBody SubmitApplicationRequest request) {
        Candidates candidate = candidate(user);
        JobOffer offer = publishedOffer(id);
        Application application = applicationRepository.findByCandidate_IdAndJobOffer_Id(candidate.getId(), offer.getId()).orElse(null);
        if (application != null && application.getStatus() == ApplicationStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already applied to this job offer");
        }
        if (application == null) {
            application = Application.builder()
                    .candidate(candidate)
                    .jobOffer(offer)
                    .status(ApplicationStatus.SUBMITTED)
                    .currentStage(RecruitmentStage.SUBMISSION)
                    .finalDecision(FinalDecision.PENDING)
                    .submittedAt(LocalDateTime.now())
                    .build();
        } else {
            application.setStatus(ApplicationStatus.SUBMITTED);
            application.setSubmittedAt(application.getSubmittedAt() == null ? LocalDateTime.now() : application.getSubmittedAt());
        }
        Application saved = applicationRepository.save(application);
        if (offer.getForm() == null || !Boolean.TRUE.equals(offer.getForm().getActive())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active application form is attached to this offer");
        }
        Map<Long, FieldType> formFieldTypes = formFieldRepository.findByForm_FormIdOrderByDisplayOrderAsc(offer.getForm().getFormId()).stream()
                .collect(java.util.stream.Collectors.toMap(field -> field.getId(), field -> field.getFieldType()));
        for (FieldResponseRequest response : request.responses() == null ? List.<FieldResponseRequest>of() : request.responses()) {
            FieldType type = formFieldTypes.get(response.fieldId());
            if (type == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Field does not belong to this offer form");
            }
            FieldResponse entity = fieldResponseRepository.findByApplication_IdAndField_Id(saved.getId(), response.fieldId()).orElseGet(FieldResponse::new);
            entity.setApplication(saved);
            entity.setField(formFieldRepository.findById(response.fieldId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown field")));
            entity.setTextValue(null);
            entity.setNumberValue(null);
            entity.setDateValue(null);
            entity.setBooleanValue(null);
            if (type == FieldType.NUMBER) entity.setNumberValue(response.numberValue());
            else if (type == FieldType.DATE) entity.setDateValue(response.dateValue());
            else if (type == FieldType.BOOLEAN || type == FieldType.CHECKBOX) entity.setBooleanValue(response.booleanValue());
            else entity.setTextValue(response.textValue());
            fieldResponseRepository.save(entity);
        }
        return new ApplicationSubmissionResponse(saved.getId(), offer.getTitle(), saved.getSubmittedAt(), "APP-" + saved.getId());
    }

    @GetMapping("/interviews")
    public List<InterviewCandidateResponse> interviews(@AuthenticationPrincipal Users user) {
        Candidates candidate = candidate(user);
        return interviewRepository.findByApplication_Candidate_Id(candidate.getId()).stream()
                .sorted(Comparator.comparing(interview -> interview.getScheduledAt(), Comparator.nullsLast(Comparator.naturalOrder())))
                .map(interview -> new InterviewCandidateResponse(
                        interview.getId(),
                        interview.getInterviewType(),
                        interview.getScheduledAt(),
                        interview.getDurationMinutes(),
                        interview.getLocation(),
                        interview.getMeetingLink(),
                        interview.getMode(),
                        interview.getStatus(),
                        interview.getApplication().getId(),
                        interview.getApplication().getJobOffer().getTitle()))
                .toList();
    }

    private Candidates candidate(Users user) {
        return candidateRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Authenticated user is not a candidate"));
    }

    private JobOffer publishedOffer(Long id) {
        JobOffer offer = jobOfferRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found"));
        if (offer.getStatus() != OfferStatus.PUBLISHED || !offer.isOpenForApplications()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer is not available");
        }
        return offer;
    }

    private Application ownApplication(Long applicationId, Long candidateId) {
        Application application = applicationRepository.findById(applicationId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        if (!Objects.equals(application.getCandidate().getId(), candidateId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found");
        }
        return application;
    }

    private CandidateProfileResponse toProfile(Candidates candidate) {
        return new CandidateProfileResponse(candidate.getId(), candidate.getFirstName(), candidate.getLastName(), candidate.getEmail(), candidate.getPhone(), candidate.getBirthDate(), candidate.getAddress(), candidate.getPostalCode(), candidate.getNationality(), candidate.getGender(), candidate.getLinkedinUrl(), candidate.getPortfolioUrl(), candidate.getProfileCompleted());
    }

    private JobOfferCandidateResponse toOffer(JobOffer offer) {
        return toOffer(offer, false);
    }

    private JobOfferCandidateResponse toOffer(JobOffer offer, boolean alreadyApplied) {
        return new JobOfferCandidateResponse(offer.getId(), offer.getTitle(), offer.getDescription(), offer.getDepartment(), offer.getContractType(), offer.getLocation(), offer.getPublicationDate(), offer.getDeadline(), offer.getForm() != null ? offer.getForm().getFormId() : null, offer.isOpenForApplications(), alreadyApplied);
    }

    private ApplicationCandidateResponse toApplication(Application application) {
        return new ApplicationCandidateResponse(application.getId(), application.getStatus(), application.getCurrentStage(), application.getSubmittedAt(), application.getUpdatedAt(), application.getJobOffer().getId(), application.getJobOffer().getTitle(), application.getJobOffer().getDepartment(), application.getJobOffer().getLocation());
    }

    private FieldResponseCandidateResponse toFieldResponse(FieldResponse response) {
        return new FieldResponseCandidateResponse(response.getId(), response.getField().getId(), response.getField().getLabel(), response.getTextValue(), response.getNumberValue(), response.getDateValue(), response.getBooleanValue());
    }

    public record CandidateProfileResponse(Long id, String firstName, String lastName, String email, String phone, LocalDate birthDate, String address, String postalCode, String nationality, String gender, String linkedinUrl, String portfolioUrl, Boolean profileCompleted) {}
    public record CandidateProfileRequest(String firstName, String lastName, String phone, LocalDate birthDate, String address, String postalCode, String nationality, String gender, String linkedinUrl, String portfolioUrl) {}
    public record JobOfferCandidateResponse(Long id, String title, String description, String department, ContactType contractType, String location, LocalDate publicationDate, LocalDate deadline, Long formId, Boolean openForApplications, Boolean alreadyApplied) {}
    public record ApplicationFormResponse(Long formId, String title, String description, List<FormFieldCandidateResponse> fields, List<FieldConditionCandidateResponse> conditions) {}
    public record FormFieldCandidateResponse(Long id, String label, FieldType fieldType, Boolean required, String placeholder, Boolean defaultVisible, Integer displayOrder, String validationRule, BigDecimal minimumValue, BigDecimal maximumValue, Integer minimumLength, Integer maximumLength, List<FieldOptionCandidateResponse> options) {}
    public record FieldOptionCandidateResponse(Long id, String label, String value, Integer displayOrder) {}
    public record FieldConditionCandidateResponse(Long id, Long sourceFieldId, Long targetFieldId, ConditionOperator operator, String expectedValue, ConditionAction action) {}
    public record ApplicationCandidateResponse(Long id, ApplicationStatus status, RecruitmentStage currentStage, LocalDateTime submittedAt, LocalDateTime updatedAt, Long jobOfferId, String jobTitle, String department, String location) {}
    public record ApplicationDetailResponse(ApplicationCandidateResponse application, List<FieldResponseCandidateResponse> responses) {}
    public record FieldResponseCandidateResponse(Long id, Long fieldId, String fieldLabel, String textValue, BigDecimal numberValue, LocalDate dateValue, Boolean booleanValue) {}
    public record FieldResponseRequest(Long fieldId, String textValue, BigDecimal numberValue, LocalDate dateValue, Boolean booleanValue) {}
    public record SubmitApplicationRequest(List<FieldResponseRequest> responses) {}
    public record ApplicationSubmissionResponse(Long applicationId, String jobTitle, LocalDateTime submittedAt, String reference) {}
    public record InterviewCandidateResponse(Long id, InterviewType interviewType, LocalDateTime scheduledAt, Integer durationMinutes, String location, String meetingLink, InterviewMode mode, InterviewStatus status, Long applicationId, String jobTitle) {}
}
