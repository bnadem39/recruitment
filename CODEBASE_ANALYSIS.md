# Recruitment Application - Comprehensive Codebase Analysis

**Date:** September 9, 2026  
**Scope:** Backend (Spring Boot) + Frontend (React/TypeScript)  
**Stack:** PostgreSQL, Docker Compose, Maven, Vite

---

## 1. Entity Relationships & Field Mappings

### Core Entity Diagram

```
Users (Abstract/Root)
├── Candidates (extends Users via JOINED inheritance)
│   ├── 1:N → Application (candidate_id)
│   └── 1:N → TalentPoolEntry (candidate_id)
│
├── Evaluators (uses Users with role=EVALUATOR)
│   ├── 1:N → Application.formEvaluator
│   └── 1:N → Interview.assignedEvaluator
│
└── HR/Admin (Users with role=HR/ADMIN)
    └── Reviews evaluations
```

### Key Entities & Field Mappings

#### **Application** 
**Location:** `candidatures/Application.java` (⚠️ NOT `application/Application.java`)  
**Table:** `applications`

```java
@Entity
public class Application {
    @Id Long id;
    
    // Status & Workflow
    @Enumerated ApplicationStatus status;           // DRAFT, PENDING_EVALUATION, ACCEPTED, REJECTED
    @Enumerated RecruitmentStage currentStage;      // SUBMISSION, HR_INTERVIEW, FINAL_DECISION
    @Enumerated FinalDecision finalDecision;        // PENDING, ACCEPTED, REJECTED
    
    // Timing
    LocalDateTime submittedAt;
    LocalDateTime updatedAt;
    LocalDateTime finalDecisionAt;
    
    // Form Evaluation (single evaluation per application)
    Integer formScore;                              // 0-100
    @Enumerated FinalDecision formDecision;         // ACCEPTED/REJECTED
    String formHrComment;                           // Comment for HR only
    String formCandidateComment;                    // Comment shared with candidate
    LocalDateTime formEvaluatedAt;                  // When form was evaluated
    @ManyToOne Users formEvaluator;                 // FK → Users (evaluator)
    
    // Rejection/Withdrawal
    String rejectionReason;
    String withdrawalReason;
    
    // Relations
    @ManyToOne(optional=false) Candidates candidate;     // FK → Candidates
    @ManyToOne(optional=false) JobOffer jobOffer;        // FK → JobOffer
    @OneToMany(cascadeAll) List<FieldResponse> fieldResponses;     // Form answers
    @OneToMany(cascadeAll) List<ApplicationDocument> documents;     // Attached files
}
```

**Query Methods:**
```java
List<Application> findByCandidate_Id(Long candidateId);
List<Application> findByJobOffer_Id(Long jobOfferId);
List<Application> findByJobOffer_IdIn(List<Long> jobOfferIds);      // Used by evaluators
Optional<Application> findByCandidate_IdAndJobOffer_Id(Long candidateId, Long jobOfferId);
boolean existsByCandidate_IdAndJobOffer_Id(Long candidateId, Long jobOfferId);

// Admin-only methods
void unassignFormEvaluator(Long userId);                           // Clears formEvaluator field
void deleteByJobOfferId(Long offerId);                             // Cascade delete
```

#### **ApplicationDocument**
**Location:** `candidatures/ApplicationDocument.java`  
**Table:** `application_documents`

```java
@Entity
public class ApplicationDocument {
    @Id Long id;
    
    @ManyToOne(optional=false) Application application;    // FK → Application
    
    String originalName;                            // Original filename from upload
    String storagePath;                             // Path/location of actual file
    String mimeType;                                // e.g., "application/pdf"
    String fileSize;                                // File size (as string)
    
    @Enumerated VerificationStatus verificationStatus;    // PENDING, APPROVED, REJECTED
    String rejectionReason;                         // Why document was rejected
    
    LocalDateTime uploadedAt;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

**⚠️ IMPORTANT:** `storagePath` is defined but **NO file serving logic exists yet**. Files are stored in DB only; physical file access not implemented.

**Repository:**
```java
public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, Long> {
    // Basic CRUD only - no query methods
}
```

#### **Interview & InterviewEvaluation**
**Location:** `gestionEntretiens/Interview.java` (Interview) and `InterviewEvaluation.java`  
**Table:** `interviews` and `interview_evaluations`

```java
@Entity
public class Interview {
    @Id Long id;
    
    // Scheduling
    @Enumerated InterviewType interviewType;        // HR, TECHNICAL, etc.
    @Enumerated InterviewMode mode;                 // ONLINE, IN_PERSON
    LocalDateTime scheduledAt;
    Integer durationMinutes;
    String meetingLink;                             // For online interviews
    String location;                                // For in-person
    String roomId;                                  // Unique room ID for video
    
    // Status
    @Enumerated InterviewStatus status;             // SCHEDULED, COMPLETED, CANCELLED
    String notes;                                   // HR organizational notes
    LocalDateTime createdAt;
    
    // Relations
    @ManyToOne(optional=false) Application application;     // FK → Application
    @ManyToOne Users assignedEvaluator;            // FK → Users (evaluator)
    @OneToOne(cascade=ALL) InterviewEvaluation evaluation;   // Evaluation for this interview
}

@Entity
public class InterviewEvaluation {
    @Id Long id;
    
    // Scores (Decimal for precision)
    BigDecimal technicalScore;       // 0-100
    BigDecimal communicationScore;   // 0-100
    BigDecimal motivationScore;      // 0-100
    BigDecimal professionalismScore; // 0-100
    BigDecimal overallScore;         // Weighted average or direct input
    
    // Comments
    String hrComment;                // Internal, visible to HR/Evaluator only
    String candidateComment;         // Shared with candidate
    String legacyComment;            // Backwards compatibility
    
    // Decision
    @Enumerated Recommendation recommendation;     // FAVORABLE, RESERVED, UNFAVORABLE
    
    LocalDateTime createdAt;
    
    @OneToOne(mappedBy="evaluation") Interview interview;  // Reverse relation
}
```

**Interview Repository:**
```java
List<Interview> findByApplication_Id(Long applicationId);          // All interviews for application
List<Interview> findByApplication_Candidate_Id(Long candidateId);  // All interviews for candidate
List<Interview> findByAssignedEvaluator_Id(Long evaluatorId);      // All assigned to evaluator
void unassignEvaluator(Long userId);                               // Clears assignedEvaluator
void deleteByApplicationJobOfferId(Long offerId);                  // Cascade delete by job offer
```

#### **TalentPoolEntry**
**Location:** TWO versions exist:
- `talentpool/TalentPoolEntry.java` (simpler)
- `talentPoolEtSuivi/TalentPoolEntry.java` (more detailed with comments)

**Both map to table:** `talent_pool_entries`

```java
@Entity
public class TalentPoolEntry {
    @Id Long id;
    
    @ManyToOne(optional=false) Candidates candidate;   // FK → Candidates
    
    String category;                                   // "Financier", "IT", "Chauffeur"
    String skills;                                     // TEXT field with skill list
    
    // Consent Management (GDPR)
    Boolean consentGiven;                              // Must be true to keep in pool
    LocalDate consentDate;                             // When consent was given
    LocalDate consentExpirationDate;                   // When consent expires
    
    // Status
    @Enumerated TalentPoolStatus status;              // ACTIVE, INACTIVE, ARCHIVED
    String notes;                                      // RH notes (private)
    
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

**Repository:**
```java
public interface TalentPoolEntryRepository extends JpaRepository<TalentPoolEntry, Long> {
    // ⚠️ EMPTY - only basic CRUD available, no query methods
}
```

#### **Users & Candidates**
**Location:** `users/Users.java` and `Candidates.java`  
**Table:** `users` (with `DTYPE='Candidates'` for inheritance)

```java
@Entity
public class Users {
    @Id Long id;
    
    String firstName;
    String lastName;
    String email;                                      // Unique
    String password;                                   // Bcrypt hashed
    Boolean emailVerified;
    LocalDateTime emailVerifiedAt;
    
    @Enumerated UserRole userRole;                    // ADMIN, HR, EVALUATOR, CANDIDATE
    @Enumerated UserStatus status;                    // ACTIVE, INACTIVE, DELETED
    
    // More fields...
}

@Entity
public class Candidates extends Users {
    LocalDate birthDate;
    String address;
    String postalCode;
    String nationality;
    String gender;
    String linkedinUrl;
    String portfolioUrl;
    Boolean profileCompleted;
    
    @OneToMany(mappedBy="candidate") List<Application> applications;
    @OneToMany(mappedBy="candidate") List<TalentPoolEntry> talentPoolEntries;
}
```

### Evaluator Assignment
**Location:** `hr/EvaluatorAssignment.java` + `EvaluatorAssignmentRepository.java`

```java
public interface EvaluatorAssignmentRepository extends JpaRepository<EvaluatorAssignment, EvaluatorAssignmentId> {
    // Composite key: evaluator_id + offer_id
    
    List<EvaluatorAssignment> findAllWithDetails();                    // Eager fetch
    List<EvaluatorAssignment> findByOfferIdWithEvaluator(Long offerId);
    List<EvaluatorAssignment> findByEvaluatorIdWithOffer(Long evaluatorId);  // Most used by evaluators
    
    void deleteByOfferId(Long offerId);
    void deleteByEvaluator_Id(Long userId);
}
```

---

## 2. Authentication & Security

### JWT Authentication Flow

**Token Generation:** [JwtService.java](backend/src/main/java/org/example/recrutment/security/JwtService.java)
```java
public String generateToken(Users user) {
    return Jwts.builder()
        .subject(user.getEmail())
        .claim("userId", user.getId())
        .claim("role", user.getUserRole().name())  // ADMIN, HR, EVALUATOR, CANDIDATE
        .issuedAt(now)
        .expiration(expiresAt)  // configurable ms duration
        .signWith(secretKey)
        .compact();
}
```

**Token Claims:**
```json
{
  "sub": "user@example.com",
  "userId": 123,
  "role": "EVALUATOR",
  "iat": 1694305200,
  "exp": 1694391600
}
```

**Authentication Filter:** [JwtAuthenticationFilter.java](backend/src/main/java/org/example/recrutment/security/JwtAuthenticationFilter.java)
```java
protected void doFilterInternal(request, response, chain) {
    // 1. Extract JWT from "Authorization: Bearer <token>" header
    String token = request.getHeader("Authorization").substring(7);
    
    // 2. Parse and validate token
    Claims claims = jwtService.parse(token);
    
    // 3. Load user from DB
    Users user = userRepository.findByEmailIgnoreCase(claims.getSubject());
    
    // 4. Verify user is ACTIVE
    if (user.getStatus() != UserStatus.ACTIVE) 
        throw 401 "User not active"
    
    // 5. Set Spring Security context with authorities
    List<GrantedAuthority> authorities = List.of(
        new SimpleGrantedAuthority("ROLE_" + user.getUserRole().name())
    );
    SecurityContextHolder.setAuthentication(
        new UsernamePasswordAuthenticationToken(user, null, authorities)
    );
}
```

### Security Configuration

**File:** [SecurityConfig.java](backend/src/main/java/org/example/recrutment/config/SecurityConfig.java)

**Route Protection Patterns:**
```java
@Configuration
@EnableMethodSecurity  // Enables @PreAuthorize
public class SecurityConfig {
    
    // Public routes (no auth required)
    .permitAll()
        "/api/auth/login"
        "/api/auth/signup"
        "/api/auth/forgot-password"
        "/api/auth/reset-password"
        "/ws/**"
    
    // ADMIN-only
    .hasRole("ADMIN")
        "/api/admin/**"
    
    // HR + ADMIN
    .hasAnyRole("ADMIN", "HR")
        "/api/hr/**"
    
    // EVALUATOR + ADMIN
    .hasAnyRole("ADMIN", "EVALUATOR")
        "/api/evaluator/**"
    
    // Everything else requires authentication
    .anyRequest().authenticated()
}
```

### @PreAuthorize Patterns Used

| Annotation | Controllers | Purpose |
|---|---|---|
| `@PreAuthorize("hasRole('EVALUATOR')")` | EvaluatorApplicationController | Only evaluators access their assigned applications |
| `@PreAuthorize("hasAnyRole('ADMIN', 'HR')")` | HrRecruitmentReviewController | HR reviews evaluations |
| `@PreAuthorize("hasRole('ADMIN')")` | AdminComplaintController | Admin-only operations |

**Custom Permission Checks:**
```java
// Inside EvaluatorApplicationController.assignedApplication()
// Verifies evaluator is assigned to the job offer before accessing application
boolean assigned = assignments.findByEvaluatorIdWithOffer(user.getId())
    .stream()
    .anyMatch(a -> a.getOffer().getId().equals(application.getJobOffer().getId()));
if (!assigned) throw HttpStatus.FORBIDDEN;
```

### User Roles & Status

**Roles:**
```java
public enum UserRole {
    ADMIN,       // Full system access
    HR,          // Recruitment management
    EVALUATOR,   // Form & interview evaluation
    CANDIDATE    // Job application submissions
}
```

**Status:**
```java
public enum UserStatus {
    ACTIVE,
    INACTIVE,
    DELETED
}
```

---

## 3. Document Storage Mechanism

### Current Implementation ⚠️ INCOMPLETE

**What Exists:**
- `ApplicationDocument` entity with `storagePath` field
- DTOs for document metadata
- Basic CRUD controller without permission checks

**What's Missing:**
- ❌ Physical file storage (no file system or S3 integration)
- ❌ File download endpoint with permission checks
- ❌ File upload handling
- ❌ Actual file serving/retrieval logic
- ❌ Document access control by role

### ApplicationDocument Fields

```java
String originalName;        // "resume.pdf" (original filename)
String storagePath;         // Path where file should be stored (currently unused)
String mimeType;            // "application/pdf" - used for Content-Type header
String fileSize;            // "2.5MB" (stored as string, not ideal)
VerificationStatus status;  // PENDING, APPROVED, REJECTED
```

### Expected Usage Pattern

**For Evaluators:**
1. GET `/api/evaluator/applications/{id}` → Returns application with documents list
2. GET `/api/evaluator/documents/{docId}` (MISSING) → Download document with access check
3. Permission check: Evaluator must be assigned to the job offer

**For HR:**
1. GET `/api/hr/documents/{docId}` (MISSING) → Download any document (unrestricted)

**For Candidates:**
1. GET `/api/candidate/documents/{docId}` (MISSING) → Download own application's documents

---

## 4. Current Evaluation Workflow

### Form Evaluation (Application-level)

**Stored on:** `Application` entity with form* fields

```java
Integer formScore;                      // 0-100 score
String formHrComment;                   // Private note for HR
String formCandidateComment;            // Shared with candidate
FinalDecision formDecision;             // ACCEPTED or REJECTED
LocalDateTime formEvaluatedAt;          // Timestamp when submitted
Users formEvaluator;                    // FK to evaluator who submitted
```

**Workflow:**

1. **Candidate submits application** → Status: DRAFT → PENDING_EVALUATION
2. **Evaluator fills form** → `POST /api/evaluator/applications/{id}/evaluation`
   ```java
   @PostMapping("/{id}/evaluation")
   public ApplicationResponse evaluate(
       @AuthenticationPrincipal Users user,
       @PathVariable Long id,
       @RequestBody FormEvaluationRequest request
   ) {
       Application app = assignedApplication(user, id);  // Permission check
       
       app.setFormScore(request.score());                 // 0-100
       app.setFormHrComment(request.commentForHR());
       app.setFormCandidateComment(request.commentForCandidate());
       app.setFormDecision(request.decision());           // ACCEPTED/REJECTED
       app.setFormEvaluator(user);
       app.setFormEvaluatedAt(now);
       
       // Update status based on decision
       if (decision == ACCEPTED) {
           app.setStatus(ACCEPTED);
           app.setCurrentStage(HR_INTERVIEW);
           // Notify candidate: "Application accepted"
       } else {
           app.setStatus(REJECTED);
           app.setCurrentStage(FINAL_DECISION);
           // Notify candidate: "Application rejected"
       }
       
       // Notify all HR staff
       notifyHR("Candidate evaluated", "Score: X");
       return app;
   }
   ```

3. **HR Reviews** → `GET /api/hr/reviews/applications`
   ```java
   List<FormReviewResponse> formEvaluations() {
       return applications.stream()
           .filter(app -> app.getFormEvaluatedAt() != null)  // Only evaluated
           .sorted(byFormEvaluatedAt, desc)
           .map(FormReviewResponse)  // Returns: candidateName, jobTitle, 
                                     //          score, evaluatorName, decision
           .toList();
   }
   ```

### Interview Evaluation (Interview-level)

**Stored on:** `InterviewEvaluation` entity (separate from Application)

```java
BigDecimal technicalScore;              // 0-100
BigDecimal communicationScore;          // 0-100
BigDecimal motivationScore;             // 0-100
BigDecimal professionalismScore;        // 0-100
BigDecimal overallScore;                // Calculated or direct
String hrComment;                       // Private HR comment
String candidateComment;                // Shared with candidate
Recommendation recommendation;          // FAVORABLE, RESERVED, UNFAVORABLE
LocalDateTime createdAt;
```

**Workflow:**

1. **Evaluator schedules interview** → `POST /api/evaluator/applications/{id}/interview`
   ```java
   InterviewRequestDTO interview = new InterviewRequestDTO()
       .applicationId(id)
       .assignedEvaluatorId(user.getId())
       .scheduledAt(request.scheduledAt())
       .durationMinutes(request.durationMinutes())
       .mode(ONLINE or IN_PERSON)
       .location(...) or .meetingLink(...)
   
   interviews.scheduleForAssignedEvaluator(interview, user);
   ```

2. **Interview occurs** → Interview.status: SCHEDULED → COMPLETED

3. **Evaluator submits evaluation** → (Endpoint not shown in code, but likely PUT)
   ```java
   @PostMapping("/{interviewId}/evaluation")
   InterviewEvaluation evaluate(...) {
       eval.setTechnicalScore(...)
       eval.setCommunicationScore(...)
       eval.setMotivationScore(...)
       eval.setProfessionalismScore(...)
       eval.setOverallScore(...)  // Weighted average
       eval.setRecommendation(...)
       eval.setHrComment(...)
       eval.setCandidateComment(...)
   }
   ```

4. **HR Reviews** → `GET /api/hr/reviews/interviews`
   ```java
   List<InterviewReviewResponse> interviewEvaluations() {
       return interviews.stream()
           .filter(i -> i.getEvaluation() != null)      // Only evaluated
           .sorted(byEvaluationDate, desc)
           .map(InterviewReviewResponse)  // Returns: candidateName, jobTitle,
                                          //          interviewDate, scores,
                                          //          recommendation, evaluatorName
           .toList();
   }
   ```

### Two-Stage Evaluation Model

```
FORM EVALUATION (Required)           INTERVIEW EVALUATION (Optional)
├─ Single per application            ├─ Multiple interviews possible
├─ Binary decision (YES/NO)          ├─ Recommendation (FAVORABLE/RESERVED/UNFAVORABLE)
├─ Score: 0-100                      ├─ Scores: Technical, Communication, 
├─ Stored on Application entity      │           Motivation, Professionalism
└─ Happens first (PENDING_EVALUATION)└─ Happens after acceptance (HR_INTERVIEW)

Application Status Flow:
DRAFT → PENDING_EVALUATION → [FORM EVAL] → ACCEPTED → HR_INTERVIEW → [INTERVIEW EVAL] → FINAL_DECISION
                          └→ REJECTED ──────────────────────────────────────────────────→ FINAL_DECISION
```

---

## 5. File Access Patterns

### Current ApplicationDocumentController

**File:** [ApplicationDocumentController.java](backend/src/main/java/org/example/recrutment/controllers/candidatures/ApplicationDocumentController.java)

```java
@RestController
@RequestMapping("/api/application-documents")
public class ApplicationDocumentController {
    
    @PostMapping
    public ResponseEntity<ApplicationDocument> create(@RequestBody ApplicationDocument e) {
        // ❌ NO PERMISSION CHECK
        return new ResponseEntity<>(service.create(e), HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<ApplicationDocument>> getAll() {
        // ❌ Returns ALL documents to ANYONE
        return ResponseEntity.ok(service.getAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApplicationDocument> getById(@PathVariable Long id) {
        // ❌ NO ACCESS CONTROL - Anyone can download any document
        return ResponseEntity.ok(service.getById(id));
    }
    
    @PutMapping("/{id}")
    @DeleteMapping("/{id}")
    // Similar - no permission checks
}
```

### ⚠️ Missing Implementations

**Evaluator Document Access:**
- ❌ `GET /api/evaluator/applications/{id}/documents` - List documents for assigned application
- ❌ `GET /api/evaluator/documents/{docId}/download` - Download with permission check
  - Must verify: evaluator is assigned to this job offer
  - Must verify: document belongs to an application for that offer

**HR Document Access:**
- ❌ `GET /api/hr/documents/{docId}/download` - Unrestricted download
- ❌ `GET /api/hr/documents/search` - Search/filter documents

**Candidate Document Access:**
- ❌ `GET /api/candidate/documents/{id}/download` - Own application's documents only
- ❌ `POST /api/candidate/applications/{id}/documents` - Upload documents

---

## 6. Repository Query Methods Summary

### ApplicationRepository
```java
List<Application> findByCandidate_Id(Long candidateId);
List<Application> findByJobOffer_Id(Long jobOfferId);
List<Application> findByJobOffer_IdIn(List<Long> jobOfferIds);  // ✓ Used by EvaluatorController
Optional<Application> findByCandidate_IdAndJobOffer_Id(Long candidateId, Long jobOfferId);
boolean existsByCandidate_IdAndJobOffer_Id(Long candidateId, Long jobOfferId);

@Modifying @Query("UPDATE Application a SET a.formEvaluator = null WHERE a.formEvaluator.id = :userId")
void unassignFormEvaluator(Long userId);

@Modifying @Query("DELETE FROM Application a WHERE a.jobOffer.id = :offerId")
void deleteByJobOfferId(Long offerId);
```

### ApplicationDocumentRepository
```java
// ⚠️ EMPTY - only inherited basic CRUD
// Missing:
// List<ApplicationDocument> findByApplication_Id(Long applicationId);
// List<ApplicationDocument> findByApplication_Candidate_Id(Long candidateId);
```

### InterviewRepository
```java
List<Interview> findByApplication_Id(Long applicationId);
List<Interview> findByApplication_Candidate_Id(Long candidateId);
List<Interview> findByAssignedEvaluator_Id(Long evaluatorId);  // ✓ Used by EvaluatorController

@Modifying @Query("UPDATE Interview i SET i.assignedEvaluator = null WHERE i.assignedEvaluator.id = :userId")
void unassignEvaluator(Long userId);

@Modifying @Query("DELETE FROM Interview i WHERE i.application.jobOffer.id = :offerId")
void deleteByApplicationJobOfferId(Long offerId);
```

### InterviewEvaluationRepository
```java
// ⚠️ EMPTY - only basic CRUD
// Missing query methods
```

### TalentPoolEntryRepository
```java
// ⚠️ EMPTY - only basic CRUD
// Missing:
// List<TalentPoolEntry> findByCandidate_Id(Long candidateId);
// List<TalentPoolEntry> findByStatus(TalentPoolStatus status);
// List<TalentPoolEntry> findByCategory(String category);
// List<TalentPoolEntry> findByConsentGivenAndConsentExpirationDateAfter(Boolean given, LocalDate date);
```

### EvaluatorAssignmentRepository
```java
// Most useful for evaluators:
List<EvaluatorAssignment> findByEvaluatorIdWithOffer(Long evaluatorId);  // ✓ Used to find assigned offers

// Support methods:
List<EvaluatorAssignment> findAllWithDetails();
List<EvaluatorAssignment> findByOfferIdWithEvaluator(Long offerId);
void deleteByOfferId(Long offerId);
void deleteByEvaluator_Id(Long userId);
```

---

## 7. Evaluator Assignment System

### EvaluatorAssignment Entity
**Location:** `hr/EvaluatorAssignment.java`  
**Table:** `evaluator_assignments` (composite key)

```java
@Entity
@IdClass(EvaluatorAssignmentId.class)
public class EvaluatorAssignment {
    @Id
    @ManyToOne Users evaluator;        // FK → Users (role=EVALUATOR)
    
    @Id
    @ManyToOne JobOffer offer;         // FK → JobOffer
    
    // Timestamps...
}

@Embeddable
public class EvaluatorAssignmentId {
    Long evaluatorId;
    Long offerId;
}
```

### Assignment Workflow

1. **HR assigns evaluator to job offer**
   ```
   POST /api/hr/evaluator-assignments
   {
     "evaluatorId": 5,
     "offerId": 12
   }
   ```

2. **Evaluator views assigned applications**
   ```java
   @GetMapping("/api/evaluator/applications")
   public List<ApplicationResponse> list(@AuthenticationPrincipal Users user) {
       // 1. Get all job offers assigned to this evaluator
       Set<Long> offerIds = assignments.findByEvaluatorIdWithOffer(user.getId())
           .stream()
           .map(a -> a.getOffer().getId())
           .collect(toSet());
       
       // 2. Get all applications for those offers
       List<Application> apps = applications.findByJobOffer_IdIn(List.copyOf(offerIds));
       
       // 3. Filter to only applications pending evaluation
       return apps.stream()
           .filter(a -> a.getStatus() == PENDING_EVALUATION || a.getFormEvaluatedAt() != null)
           .sorted(bySubmittedAt, desc)
           .map(toResponse)
           .toList();
   }
   ```

3. **Permission enforcement**
   ```java
   private Application assignedApplication(Users user, Long applicationId) {
       Application app = applications.findById(applicationId)
           .orElseThrow(() -> NOT_FOUND);
       
       // Verify evaluator is assigned to this application's job offer
       boolean isAssigned = assignments.findByEvaluatorIdWithOffer(user.getId())
           .stream()
           .anyMatch(a -> a.getOffer().getId().equals(app.getJobOffer().getId()));
       
       if (!isAssigned) throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
           "You are not assigned to this job offer");
       
       return app;
   }
   ```

### Currently Missing
- ❌ `POST /api/hr/evaluator-assignments` - Assign evaluator to offer
- ❌ `DELETE /api/hr/evaluator-assignments/{evaluatorId}/{offerId}` - Revoke assignment
- ❌ `GET /api/hr/evaluator-assignments` - View all assignments
- ❌ `GET /api/hr/evaluators/{id}/assignments` - View assignments for specific evaluator

---

## 8. Frontend API Patterns

### API Configuration

**File:** [frontend/src/shared/api.ts](frontend/src/shared/api.ts)

```typescript
export const API = import.meta.env.VITE_API_URL ?? '';  // e.g., 'http://localhost:8080'

export const authHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
});

// Generic fetch wrapper
async function request<T>(url: string, token: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API}${url}`, {
        ...init,
        headers: { ...authHeaders(token), ...(init?.headers || {}) }
    });
    
    if (response.status === 204) return undefined as T;
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Request failed (${response.status})`);
    }
    return response.json();
}
```

### EvaluatorDashboard API Calls

**File:** [frontend/src/evaluator/EvaluatorDashboard.tsx](frontend/src/evaluator/EvaluatorDashboard.tsx)

```typescript
// Load assigned applications
async function loadApplications(token: string): Promise<CandidateApplication[]> {
    return request<CandidateApplication[]>('/api/evaluator/applications', token);
}

// Submit form evaluation
async function submitFormEvaluation(
    applicationId: number,
    token: string,
    evaluation: FormEvaluation
): Promise<CandidateApplication> {
    return request<CandidateApplication>(
        `/api/evaluator/applications/${applicationId}/evaluation`,
        token,
        {
            method: 'POST',
            body: JSON.stringify({
                score: evaluation.score,
                commentForHR: evaluation.hrComment,
                commentForCandidate: evaluation.candidateComment,
                decision: evaluation.decision
            })
        }
    );
}

// Load interview evaluation
async function loadInterviewEvaluation(interviewId: number, token: string): Promise<Evaluation> {
    const response = await fetch(`${API}/api/interviews/${interviewId}/evaluation`, {
        headers: authHeaders(token)
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Could not load evaluation');
    return response.json();
}

// Submit interview evaluation
async function submitInterviewEvaluation(
    interviewId: number,
    token: string,
    evaluation: Evaluation
): Promise<Evaluation> {
    return request<Evaluation>(
        `/api/interviews/${interviewId}/evaluation`,
        token,
        {
            method: 'POST',
            body: JSON.stringify({
                technicalScore: Number(evaluation.technicalScore),
                communicationScore: Number(evaluation.communicationScore),
                motivationScore: Number(evaluation.motivationScore),
                professionalismScore: Number(evaluation.professionalismScore),
                overallScore: Number(evaluation.overallScore),
                recommendation: evaluation.recommendation,
                hrComment: evaluation.hrComment,
                candidateComment: evaluation.candidateComment
            })
        }
    );
}

// Schedule interview
async function scheduleInterview(
    applicationId: number,
    token: string,
    request: ScheduleInterviewRequest
): Promise<InterviewResponseDTO> {
    return request<InterviewResponseDTO>(
        `/api/evaluator/applications/${applicationId}/interview`,
        token,
        {
            method: 'POST',
            body: JSON.stringify(request)
        }
    );
}
```

### Frontend Data Types

```typescript
type CandidateApplication = {
    id: number;
    status: string;
    submittedAt?: string;
    jobOfferTitle: string;
    candidateName: string;
    candidateEmail: string;
    formScore?: number;
    formHrComment?: string;
    formCandidateComment?: string;
    formDecision?: string;
    formEvaluatedAt?: string;
    answers: FieldResponse[];
};

type Evaluation = {
    id?: number;
    interviewId?: number;
    technicalScore: number | '';
    communicationScore: number | '';
    motivationScore: number | '';
    professionalismScore: number | '';
    overallScore: number | '';
    recommendation: Recommendation | '';
    hrComment: string;
    candidateComment: string;
    createdAt?: string;
};

type FormEvaluation = {
    score: number | '';
    commentForHR: string;
    commentForCandidate: string;
    decision: 'ACCEPTED' | 'REJECTED' | '';
};
```

---

## 9. Existing Talent Pool Status

### Database Entity Exists ✓
- `TalentPoolEntry` entity defined (with TWO package versions)
- Table: `talent_pool_entries` properly created
- Relationships: Candidates → TalentPoolEntry (1:N)

### Features Implemented
- ✓ Candidate consent management (consentGiven, consentDate, consentExpirationDate)
- ✓ Status tracking (ACTIVE, INACTIVE, ARCHIVED)
- ✓ Category classification (skills grouping)
- ✓ HR notes field (internal documentation)

### Features Missing ❌
- ❌ **API Controller** - No REST endpoints for TalentPoolEntry
- ❌ **HR Interface** - No frontend for viewing talent pool
- ❌ **Search/Filter** - No query methods in repository
- ❌ **Bulk Operations** - Can't update multiple entries
- ❌ **Candidate Management** - Can't search by skills, category, or status
- ❌ **Consent Expiration Handling** - No automatic status updates
- ❌ **Integration with Applications** - No way to match talent pool candidates to job offers

### Repository is Bare
```java
public interface TalentPoolEntryRepository extends JpaRepository<TalentPoolEntry, Long> {
    // EMPTY - Only inherited basic CRUD (save, findById, findAll, delete)
}
```

**⚠️ Action Needed:** Add query methods:
```java
List<TalentPoolEntry> findByCandidate_Id(Long candidateId);
List<TalentPoolEntry> findByStatus(TalentPoolStatus status);
List<TalentPoolEntry> findByCategory(String category);
List<TalentPoolEntry> findByConsentGivenAndConsentExpirationDateAfter(Boolean given, LocalDate date);
List<TalentPoolEntry> findByStatusAndConsentExpirationDateAfter(TalentPoolStatus status, LocalDate date);
```

---

## 10. HR Controllers & Endpoints

### HrRecruitmentReviewController
**File:** [HrRecruitmentReviewController.java](backend/src/main/java/org/example/recrutment/controllers/hr/HrRecruitmentReviewController.java)  
**Route Base:** `/api/hr/reviews`  
**Permission:** `@PreAuthorize("hasAnyRole('ADMIN', 'HR')")`

```java
@RestController
@RequestMapping("/api/hr/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class HrRecruitmentReviewController {
    
    // ✓ IMPLEMENTED
    @GetMapping("/applications")
    public List<FormReviewResponse> formEvaluations() {
        // Returns all form-evaluated applications, sorted by evaluation date (newest first)
        // Fields: applicationId, status, candidateName, jobOfferTitle, evaluatorName, 
        //         score, commentForHR, commentForCandidate, evaluatedAt
    }
    
    // ✓ IMPLEMENTED
    @GetMapping("/interviews")
    public List<InterviewReviewResponse> interviewEvaluations() {
        // Returns all interview-evaluated applications, sorted by evaluation date (newest first)
        // Fields: interviewId, applicationId, candidateName, jobOfferTitle, evaluatorName,
        //         interviewDate, score, commentForHR, recommendation (FAVORABLE/RESERVED/UNFAVORABLE), evaluatedAt
    }
    
    // ❌ MISSING
    @PostMapping("/applications/{id}/decision")
    // HR makes FINAL decision on application (ACCEPT/REJECT for hire)
    
    // ❌ MISSING
    @PostMapping("/applications/{id}/request-more-info")
    // HR requests evaluator provide additional information
    
    // ❌ MISSING
    @GetMapping("/candidates")
    // Browse all candidates across all job offers
    
    // ❌ MISSING
    @GetMapping("/candidates/search")
    // Search candidates by name, email, job offer, date range
}
```

### Other HR Controllers Mentioned

**TalentPoolEntryController**
```java
@RestController
@RequestMapping("/api/talent-pool")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class TalentPoolEntryController {
    // ⚠️ Likely stub - needs full implementation
    // Should provide:
    // GET /api/talent-pool                    - List with filters
    // GET /api/talent-pool/{id}               - View single entry
    // POST /api/talent-pool/{candidateId}     - Add candidate to pool
    // PUT /api/talent-pool/{id}               - Update consent/status
    // DELETE /api/talent-pool/{id}            - Remove from pool
    // POST /api/talent-pool/{id}/match-offers - Suggest job offers for candidate
}
```

### Existing HR Functionality by Feature

| Feature | Endpoint | Status | Notes |
|---------|----------|--------|-------|
| View form evaluations | `GET /api/hr/reviews/applications` | ✓ Exists | Read-only, no filtering |
| View interview evaluations | `GET /api/hr/reviews/interviews` | ✓ Exists | Read-only, no filtering |
| Make final decision | `POST /api/hr/reviews/applications/{id}/decision` | ❌ Missing | Critical feature |
| Manage talent pool | `GET /api/talent-pool` | ❌ Missing | No controller or limited |
| Search candidates | `GET /api/candidates/search` | ❌ Missing | Need query by name/email |
| Manage evaluator assignments | `POST/DELETE /api/hr/evaluator-assignments` | ❌ Missing | Essential for workflow |
| Request additional evaluation | `POST /api/hr/evaluator-assignments/{id}/reassign` | ❌ Missing | Workflow enhancement |

---

## Summary: Missing Pieces to Implement

### CRITICAL (Blocking Features)

1. **Evaluator Document Access** 
   - [ ] Endpoint to list application documents (with permission check)
   - [ ] Endpoint to download document (with permission check)
   - [ ] Verify evaluator is assigned to job offer

2. **HR Final Decision Endpoint**
   - [ ] `POST /api/hr/reviews/applications/{id}/decision`
   - [ ] Allow HR to make ACCEPT/REJECT decision
   - [ ] Update Application.finalDecision and FinalDecision fields
   - [ ] Notify candidate and evaluators

3. **Talent Pool Management**
   - [ ] Full CRUD endpoints for TalentPoolEntry
   - [ ] Query methods in repository
   - [ ] HR interface to view/edit talent pool
   - [ ] Consent expiration tracking

### IMPORTANT (Quality/Usability)

4. **Evaluator Assignment Management**
   - [ ] Endpoints to assign/unassign evaluators to job offers
   - [ ] HR dashboard to manage evaluator workload

5. **Document Upload/Download**
   - [ ] Physical file storage mechanism
   - [ ] Document upload endpoint
   - [ ] Document download endpoint with Content-Type headers
   - [ ] File cleanup on deletion

6. **HR Dashboard**
   - [ ] Filtering/sorting on evaluations
   - [ ] Search candidates by name, email, status
   - [ ] Bulk operations

### Backend Architectures to Define

- [ ] File storage strategy (filesystem, S3, database)
- [ ] Document permission model for different roles
- [ ] Notification system for decision updates
- [ ] Audit logging for HR decisions

---

## Security Audit

### Strong Points ✓
- JWT tokens with role claims
- @PreAuthorize method-level security
- Custom permission checks in controllers (assignedApplication method)
- User status verification (ACTIVE check)

### Weaknesses ⚠️
- ApplicationDocumentController has NO permission checks
- TalentPoolEntryController likely unprotected (if exists)
- No audit logging for sensitive operations
- formEvaluator assignment allows evaluator to self-assign (verify in code)
- No rate limiting visible

### Recommendations
- [ ] Add @PreAuthorize to all document endpoints
- [ ] Audit all REST controllers for permission checks
- [ ] Add document access logging
- [ ] Validate evaluator cannot evaluate own application
- [ ] Add request rate limiting

---

## Frontend Component Status

### Existing Components
- ✓ EvaluatorDashboard.tsx - Form & interview evaluation
- ✓ HrDashboard.tsx - HR management interface
- ✓ CandidateDashboard.tsx - Candidate job applications
- ✓ ComplaintsPage.tsx - Complaint management
- ✓ InterviewRoom.tsx - Video interview space

### Missing Components
- ❌ TalentPoolPage.tsx - Manage talent pool candidates
- ❌ HrCandidateEvaluationsPage.tsx - Review and decide on evaluations
- ❌ EvaluatorDocumentsPanel.tsx - Document viewer for evaluators
- ❌ DocumentUploadModal.tsx - Candidate document upload
- ❌ EvaluatorAssignmentPanel.tsx - Assign evaluators to offers

---

## Database Schema Notes

**Key Tables:**
- `users` (DTYPE='Candidates' for inheritance)
- `candidates`
- `applications`
- `application_documents`
- `interviews`
- `interview_evaluations`
- `talent_pool_entries`
- `evaluator_assignments` (composite key)
- `job_offers`
- `job_offer_forms` (links offers to forms)

**Foreign Key References:**
```
applications.candidate_id → users.id
applications.job_offer_id → job_offers.id
applications.form_evaluator_id → users.id
application_documents.application_id → applications.id
interviews.application_id → applications.id
interviews.assigned_evaluator_id → users.id
interviews.evaluation_id → interview_evaluations.id
talent_pool_entries.candidate_id → users.id
evaluator_assignments.evaluator_id → users.id
evaluator_assignments.offer_id → job_offers.id
```

---

**Analysis Complete** ✓ All 10 requirements covered with code references and implementation status.
