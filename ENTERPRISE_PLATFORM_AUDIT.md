# Enterprise Platform Production-Readiness Audit

**Audit date:** 2026-08-13  
**Repository:** `D:\BFPME\recruitments`  
**Method:** complete first-party source/configuration inventory, dependency/config review, endpoint-to-service-to-entity tracing, repository searches for cross-cutting controls, and available build checks. Generated/vendor files were identified but not treated as application source.

## 1. Executive summary

This repository is an early recruitment-platform prototype, not a production-ready SaaS. It contains the beginnings of a useful domain model—adaptive application forms, job offers, candidates, applications, documents, interviews/evaluations, talent pooling, notifications, and audit records—but it currently has two disconnected products:

1. A React “FormaX” form-studio prototype whose state is entirely in browser memory.
2. A Spring Boot CRUD API whose application/candidature domain was implemented twice and is internally inconsistent.

The strongest work is the DTO-oriented implementation for forms, offers, interviews, and evaluations: nested resource URLs, parent-ownership checks, validation annotations, DTO mapping, and transactional writes are present. However, the backend is not currently reproducibly buildable from this checkout, authentication and authorization are absent, sensitive entities are returned directly, every API route is public, database evolution uses Hibernate `update`, lists are unbounded, and there is no production infrastructure, observability, backup, CI/CD, or meaningful test suite.

**Overall production readiness: 24/100 — do not launch.** A limited internal UI prototype can be demonstrated. Production or external testing with real candidate data should wait until P0 items are resolved.

### Release gates

- **P0:** establish one compilable application domain and one service implementation; repair and enforce backend build/test.
- **P0:** implement authentication, password hashing, deny-by-default RBAC/ownership authorization, and remove public write/read access.
- **P0:** stop returning JPA user/domain entities; create request/response DTOs that never expose passwords or unrestricted relationships.
- **P0:** replace schema auto-update with reviewed migrations and add integrity constraints/indexes.
- **P0:** connect the frontend to real APIs and make save/publish/authentication truthful.
- **P0:** add deployment, secrets, health, logging, monitoring, backup/restore, and rollback capabilities.

## 2. Platform mental model

### Purpose, domain, and users

The code indicates an applicant-tracking/recruitment-form platform. Candidate users create profiles and applications; HR/admin users design adaptive forms and job offers, manage applications, schedule interviews, record evaluations, notify users, and maintain a talent pool. `UserRole` includes ADMIN, HR, INTERVIEWER, and CANDIDATE. There is no implemented tenant/company boundary, payment, analytics, AI, or actual identity workflow.

### Implemented stack

- Frontend: React 19, TypeScript, Vite 7; one `App.tsx` and one minified-style stylesheet.
- Backend: Java 17, Spring Boot parent declared as 4.1.0, Spring MVC, Data JPA, Security, Validation, springdoc, Lombok, PostgreSQL driver, JJWT dependencies.
- Data: PostgreSQL 17 in Compose, Hibernate schema mutation (`ddl-auto=update`).
- Infrastructure: local database Compose service only. No backend/frontend image, reverse proxy, cloud manifests, CI, or runtime observability.

### Actual architecture

```text
Browser
  |
  +-- React/Vite SPA (hash-based local views)
  |     home -> fake sign-in/sign-up -> in-memory form studio
  |     X no HTTP client, persistence, real session, or backend integration
  |
  +-- expected but not connected --> Spring MVC /api/**
                                      |
                                      +-- Controllers
                                      |    +-- DTO-oriented modules: forms/offers/interviews
                                      |    +-- entity CRUD modules: candidates/applications/docs/
                                      |        responses/notifications/talent pool/audit
                                      |
                                      +-- Services (two competing application implementations)
                                      |
                                      +-- Spring Data repositories
                                      |
                                      +-- Hibernate -- PostgreSQL

External integrations / queue / object storage / mail / analytics / AI / payments: absent
```

### Principal data flow

The intended core flow appears to be: create form → add ordered fields/options/conditions → attach form to job offer → candidate submits an application and field responses/documents → HR schedules interviews → interviewer evaluates → final decision/talent-pool entry → notification/audit. That workflow is only partially represented in backend CRUD. There is no end-to-end orchestration, state-machine enforcement, frontend integration, notification delivery, file transfer, or audit interception.

## 3. Feature inventory

Scores describe working completeness in this repository, not conceptual model coverage.

| Feature | Purpose and current implementation | Dependencies / key risks | Complete |
|---|---|---|---:|
| Marketing landing | FormaX landing page in `frontend/src/App.tsx:40-57` | Static; product identity differs from repository; encoding defects | 65% |
| Sign-in/sign-up | HTML forms route directly to studio (`App.tsx:59-76`) | No API, session, verification, recovery, or hashing | 10% |
| Form studio | Add/rename eight component types in local state (`App.tsx:79-117`) | Refresh loses work; “saved”, draft, preview, publish, styles, logic are nonfunctional | 25% |
| Adaptive form templates | DTO CRUD for forms | Public, unpaginated, no versioning/publish snapshot | 55% |
| Form fields/options | Nested DTO CRUD with ownership checks and display order | No reorder transaction or unique order constraint; UI disconnected | 60% |
| Conditional logic | Source/target field CRUD and same-form checks | No cycle detection/evaluator; frontend logic tab inert | 45% |
| Job offers | DTO CRUD, status filter, form association | No public/private separation, pagination, transition rules, search | 55% |
| Candidate profiles | Direct entity CRUD | Password exposed/assignable, no validation or authorization | 20% |
| Applications | Conflicting old entity CRUD and newer DTO service | Interface/repository mismatch; likely compile/startup failure | 15% |
| Field responses | Generic entity CRUD skeleton | No typed validation against form definition; duplicate entity model | 15% |
| Documents | Metadata CRUD only | No upload/download/storage/scanning/access control; paths client-controlled | 10% |
| Interviews | DTO CRUD and application association | No calendar integration, conflict/time-zone checks, invitations | 50% |
| Evaluations | Singleton-style nested API and score model | No interviewer authorization; concurrency/workflow rules unclear | 50% |
| Talent pool | Generic entity CRUD | No workflows/search/consent/retention; duplicate unused model | 20% |
| Notifications | Generic entity CRUD records | No recipient relation, sender, queue, retries, email/SMS delivery | 15% |
| Audit log | Client-writeable generic CRUD | Not automatically produced; can be altered/deleted; not trustworthy | 10% |
| OpenAPI | springdoc annotations on selected modules | Public; partial coverage; version compatibility unverified | 35% |
| RBAC/authentication | Roles and JWT libraries exist | No filter/token service/user details/login; API explicitly public | 2% |
| Admin console | Domain endpoints could support one | No admin frontend or authorization | 5% |
| Search/reporting/analytics | Expected ATS capability | Absent | 0% |
| Background jobs | Needed for notifications/retention | Absent | 0% |
| Payments/monetization | Potential SaaS function | Absent; no plans/tenancy/billing | 0% |
| AI integrations | None required by current flow | Absent; do not add before core controls | 0% |

No feature flags identify deprecated/experimental code. The duplicate packages under `entities/application`, `entities/candidatures`, `entities/talentpool`, and `entities/talentPoolEtSuivi`, plus duplicate service implementations, are best classified as abandoned/in-progress branches accidentally coexisting in production source.

## 4. Highest-risk findings

Each finding includes the requested title, description, importance, evidence, severity, solution, effort, and impact.

### F-01 — Backend domain/service wiring is internally contradictory

- **Description:** `ApplicationService` uses `entities.application.Application`, while another same-package `services/candidatures/ApplicationServiceImpl.java` declares it implements that interface but accepts/returns DTOs and `entities.candidatures.Application`. A second `services/impl/ApplicationServiceImpl.java` implements the entity contract. `ApplicationRepository` is typed to the old entity while interview/job-offer relationships use the new one.
- **Why it matters:** This is a compile-time blocker; even after superficial repair, two JPA entities named `Application` map `applications`, as do duplicate document/response/audit/notification/talent entities, creating persistence ambiguity and data-loss risk.
- **Evidence:** `services/candidatures/ApplicationService.java:3-4`; `services/candidatures/ApplicationServiceImpl.java:5,28,46`; `services/impl/ApplicationServiceImpl.java:4,9`; `repositories/candidatures/ApplicationRepository.java:3-4`; both entity package trees.
- **Severity:** Critical.
- **Suggested solution:** Select the DTO-oriented `entities.candidatures` aggregate, update the interface/controller/repositories to it, remove the obsolete duplicate tree and services, then run context and migration tests.
- **Effort:** 2–4 days.
- **Expected impact:** Restores a coherent, buildable backend and prevents two models from mutating the same tables.

### F-02 — All APIs, including audit and personal data, are anonymous

- **Description:** Security disables CSRF and explicitly permits `/api/**`; there is no authentication filter, login controller, `UserDetailsService`, method security, or role/ownership check.
- **Why it matters:** Any network client can list, create, overwrite, or delete candidates, applications, documents, notifications, audit records, forms, offers, and interview evaluations.
- **Evidence:** `config/SecurityConfig.java:20-28`; repository-wide search finds no authentication implementation or `@PreAuthorize`.
- **Severity:** Critical.
- **Suggested solution:** Build tested identity flows, use short-lived access tokens or secure server sessions, deny by default, and define endpoint-level RBAC plus candidate-resource ownership. Keep only registration/login and published-offer reads public.
- **Effort:** 1–2 weeks.
- **Expected impact:** Removes the largest confidentiality, integrity, and regulatory exposure.

### F-03 — Passwords and privilege fields are raw API data

- **Description:** candidate endpoints accept/return the JPA entity. `Users.password`, `userRole`, and `status` are writable; update copies all three directly. No encoder is used and serialization is not suppressed.
- **Why it matters:** Password hashes—or plaintext if callers send it—can be returned to anonymous callers; clients can self-assign ADMIN/HR and change account state.
- **Evidence:** `controllers/candidatures/CandidatesController.java:26-49`; `entities/users/Users.java:73-90,111-127`; `services/impl/CandidatesServiceImpl.java:27-33`.
- **Severity:** Critical.
- **Suggested solution:** Use narrow registration/admin/profile DTOs; mark password write-only as defense in depth; hash with Argon2id or bcrypt; never bind roles from public input; add unique normalized email lookup and tests.
- **Effort:** 2–4 days after identity design.
- **Expected impact:** Prevents credential disclosure and trivial privilege escalation.

### F-04 — Audit data is forgeable and erasable

- **Description:** anonymous CRUD exposes creation, update, and deletion of `AuditLog`; no application event/aspect automatically writes logs.
- **Why it matters:** The table cannot support investigations or enterprise compliance because an attacker can manufacture or erase evidence.
- **Evidence:** `controllers/audit/AuditLogController.java:9-16`; `services/impl/AuditLogServiceImpl.java`; `entities/audit/AuditLog.java:16-31`.
- **Severity:** High.
- **Suggested solution:** Remove public mutation endpoints; generate append-only events server-side with authenticated actor, request/correlation ID, safe diffs, and protected retention/export.
- **Effort:** 3–5 days.
- **Expected impact:** Establishes trustworthy accountability.

### F-05 — Secrets and generated dependencies are committed

- **Description:** `.env` is tracked and Compose contains `POSTGRES_PASSWORD: admin123`. `.gitignore` ignores only an IDE file; `frontend/node_modules` and `frontend/dist` are tracked.
- **Why it matters:** Credentials persist in history and vendor/build files enlarge diffs, conceal dependency provenance, and make review/release unreliable.
- **Evidence:** `.env` from `git ls-files`; `compose.yaml:8-10`; `.gitignore:1`; tracked `frontend/node_modules/**` and `frontend/dist/**`.
- **Severity:** High.
- **Suggested solution:** Rotate exposed credentials; untrack secrets/vendor/output; add `.env`, comprehensive ignores, secret scanning, and CI installs from lockfiles.
- **Effort:** <1 day (history cleanup/rotation may take longer).
- **Expected impact:** Reduces credential and supply-chain/repository risk.

### F-06 — Schema lifecycle can drift or destroy data

- **Description:** Hibernate defaults to `ddl-auto=update`; no Flyway/Liquibase migrations, baseline DDL, rollback, or environment profile exists. Multiple entity variants map the same table names.
- **Why it matters:** Production schema changes are unreviewed and nonrepeatable. Releases cannot be promoted or rolled back safely.
- **Evidence:** `application.properties:7`; no migration directory/dependency; duplicate `@Table(name="applications")`, `application_documents`, `field_responses`, `audit_logs`, `notifications`, and talent-pool mappings.
- **Severity:** High.
- **Suggested solution:** Consolidate entities, generate and review a baseline migration, set production validation-only, and version every schema change with forward/restore procedures.
- **Effort:** 3–5 days.
- **Expected impact:** Reproducible environments and safer releases.

### F-07 — The frontend makes false persistence/authentication claims

- **Description:** auth submit unconditionally opens studio; “All changes saved,” Save Draft, Preview, and Publish have no handlers; form data lives only in React state.
- **Why it matters:** Users can believe sensitive recruitment forms are saved/published when refresh destroys them. This is a product-trust and data-loss defect.
- **Evidence:** `frontend/src/App.tsx:61,80-95`; repository search finds no `fetch`/Axios/API client.
- **Severity:** High.
- **Suggested solution:** Add a typed API layer, real session state, persisted draft/version model, explicit save state/errors, publish confirmation and immutable published versions; disable or label unavailable controls meanwhile.
- **Effort:** 2–4 weeks.
- **Expected impact:** Converts the prototype into a usable workflow.

### F-08 — Unbounded reads and relationship serialization will fail at scale

- **Description:** all collection endpoints return `List` from `findAll`; entity endpoints serialize bidirectional JPA relationships; no pagination, projections, fetch plans, or caching exists.
- **Why it matters:** Heap, query time, response size, N+1 queries, lazy-loading exceptions, and JSON recursion grow with total records and expose excessive data.
- **Evidence:** `CandidatesServiceImpl.java:54-55`; generic services/controllers; `Candidates.java:90-94`; `Application.java:80-86`; no `Pageable` in source.
- **Severity:** High.
- **Suggested solution:** DTO-only APIs; mandatory cursor/page pagination and limits; query projections/entity graphs; inspect SQL with integration tests; add indexes based on query paths.
- **Effort:** 1–2 weeks.
- **Expected impact:** Predictable latency/memory and smaller data exposure.

### F-09 — Database integrity relies mainly on Java

- **Description:** important uniqueness/range/business invariants are absent: candidate+offer application uniqueness, field order per form, option order/value per field, one evaluation per interview, score/rating limits, positive positions/duration, deadline ordering, and transition consistency.
- **Why it matters:** concurrency, scripts, retries, or bugs can persist duplicates and contradictory recruitment decisions.
- **Evidence:** entity annotations and repositories contain few constraints and no `@Version`/indexes; services use check-then-save patterns.
- **Severity:** High.
- **Suggested solution:** add database unique/check/FK/index constraints, optimistic locking, idempotency for submissions, and explicit state-transition services.
- **Effort:** 1–2 weeks.
- **Expected impact:** Correct data under concurrency and safer recovery.

### F-10 — Testing provides no release confidence

- **Description:** the only backend test is `contextLoads`; the frontend has no test dependencies/scripts. No unit, repository, API, authorization, migration, contract, E2E, accessibility, performance, or security tests exist.
- **Why it matters:** critical domain and authorization changes cannot be verified; the present context test is itself blocked by build tooling/configuration.
- **Evidence:** `backend/src/test/.../RecrutmentApplicationTests.java:6-11`; `frontend/package.json:scripts`.
- **Severity:** High.
- **Suggested solution:** create a risk-first test pyramid using Testcontainers PostgreSQL, MVC authorization/validation tests, domain transition tests, frontend component tests, and Playwright E2E for core flows.
- **Effort:** initial 1–2 weeks; continuous.
- **Expected impact:** Enables safe refactoring and repeatable release gates.

### F-11 — No production operational platform exists

- **Description:** Compose runs only PostgreSQL with a fixed public host port. There are no app images, CI/CD, TLS/edge, health endpoints, structured logs, metrics, traces, alerts, backup/restore, disaster recovery, rollout, or rollback definitions.
- **Why it matters:** even working code cannot be safely deployed, observed, recovered, or supported.
- **Evidence:** `compose.yaml`; absence of Dockerfiles, workflows, Actuator, monitoring and deployment files.
- **Severity:** High.
- **Suggested solution:** containerize both apps, add CI quality/security gates and artifact promotion, environment-specific secret injection, Actuator probes, structured/redacted logs, metrics/tracing/SLO alerts, automated encrypted backups and restore drills, and documented rollback.
- **Effort:** 3–6 weeks.
- **Expected impact:** Operable, recoverable service rather than a local development setup.

### F-12 — Error and validation behavior is inconsistent

- **Description:** DTO modules use `@Valid`, generic entity CRUD does not. Global handling covers only one of two `ResourceNotFoundException` classes plus bean validation; constraint, malformed enum/JSON, conflict, database, and generic failures lack a stable envelope. Some code throws `ResponseStatusException` directly.
- **Why it matters:** clients receive inconsistent/error-leaking responses, and failures are hard to correlate or support.
- **Evidence:** `exceptions/GlobalExceptionHandler.java:25-48`; `shared/exceptions/ResourceNotFoundException.java`; entity CRUD controllers; `FieldConditionServiceImpl.java:111-115`.
- **Severity:** Medium.
- **Suggested solution:** one exception hierarchy and RFC 9457-style problem details with stable codes, trace ID, safe messages, conflict handlers, and consistent DTO validation.
- **Effort:** 2–3 days.
- **Expected impact:** Predictable APIs and better incident diagnosis.

## 5. Code quality and architecture audit

| Area | Score | Evidence-based assessment |
|---|---:|---|
| Module/domain boundaries | 35/100 | Domain folders exist, but French/English/case variants and duplicate generations cross-wire aggregates. |
| Separation of concerns | 40/100 | Better modules use DTO/controller/service/repository layers; generic CRUD exposes persistence directly. |
| SOLID/maintainability | 38/100 | Constructor injection and small services help; two service styles and duplicated models violate single source of truth. |
| API design | 44/100 | Nested form resources and singleton evaluation are good; generic CRUD, no versioning/pagination/idempotency, mixed DTO/entity contracts are not. |
| Dependency hygiene | 25/100 | duplicate JPA/validation/Postgres/Lombok dependencies; unused JWT stack; questionable Boot/springdoc combination; vendor tree committed. |
| Error handling | 35/100 | focused global handler exists but covers a fraction of actual failures and wrong exception namespace. |
| Documentation/comments | 32/100 | some useful local comments/OpenAPI annotations; no system documentation and visible mojibake. |

Refactoring targets:

- Delete one entire duplicate entity/service/repository branch after migration analysis; do not attempt adapters around both.
- Make every controller DTO-only. Extract `CandidateAccountService`, `ApplicationWorkflowService`, `DocumentStorageService`, `NotificationDeliveryService`, and server-side `AuditService`.
- Centralize entity↔DTO mappers and problem responses; keep domain transition rules out of controllers.
- Split `frontend/src/App.tsx` into routes/pages, `FormStudio`, library, canvas, inspector, auth, API client, query/cache hooks, and accessible design-system components.
- Replace the one-line CSS bundle in source with tokens and component/page modules; preserve generated minification only for output.
- Adopt one language/naming convention and correct repository-wide UTF-8 mojibake (`â€¦`, `Ã©`, etc.).

## 6. Frontend, UX, and accessibility audit

The UI is visually distinctive and the build is compact, but it is a desktop mock rather than an application. The studio locks a three-column grid at 360/min-450/395 px and `height:100vh`; no responsive breakpoint is visible. Controls use glyph strings rather than icons with accessible names, canvas fields are buttons containing labels/heading-like content, inspector tabs are noninteractive spans, and toast/status updates have no live region. Keyboard drag/reorder, focus management, skip links, error summaries, password autocomplete, route-not-found handling, reduced-motion support, and contrast verification are absent. Hash routing accepts arbitrary values then renders a blank shell. Google Fonts is a third-party runtime dependency with privacy/reliability implications.

Loading, API errors, offline/retry, destructive confirmations, empty results beyond the blank canvas, and unsaved-changes protection do not exist because there is no data layer. There is no caching/query library. SEO is limited to a Vite shell and is not important for authenticated studio routes, but public offers would need crawlable metadata/server rendering or pre-rendering. The current 201.11 KB JS / 63.10 KB gzip and 11.22 KB CSS / 3.48 KB gzip build is acceptable for a prototype; functionality and responsive accessibility dominate bundle optimization.

Product friction/missing workflows include email verification, password reset/MFA, organization onboarding, team invitations, role management, candidate consent/privacy controls, offer search/detail/application experience, form preview/test/publish/version/rollback, autosave history, application status tracking, interview invitations/time zones/rescheduling, evaluation assignment, bulk operations, exports/reporting, retention/deletion requests, notification preferences, and support/help.

## 7. Backend and API audit

Positive patterns include constructor injection, transactional writes in the newer services, parent-child ownership checks for nested form resources, DTO validation in newer controllers, and response DTO mapping that avoids some recursion. These patterns should become the standard.

Risks beyond the top findings:

- CRUD update semantics are full replacement through `PUT` but nullable fields are sometimes selectively retained and sometimes erased; publish/application state transitions are unrestricted.
- Deletes are hard deletes. Recruitment/legal retention and referential dependency behavior are unspecified.
- No CORS policy is explicit. Browser integration will either fail cross-origin or tempt a dangerously broad configuration.
- No request-size/time limits, rate limiting, idempotency keys, API versioning, concurrency tokens, or abuse controls exist.
- Document records contain paths but no storage abstraction, upload validation, MIME sniffing, malware scanning, randomized object keys, signed downloads, or per-owner access.
- JJWT is declared but unused, increasing attack surface without capability.
- Notifications represent `sentAt` as `Boolean`, and have no recipient; the model cannot reliably represent delivery attempts.
- Audit `oldValue/newValue` may store sensitive data without redaction/encryption policy.

No SQL injection sink was found because repositories use Spring Data derived queries; that does not mitigate mass assignment/BOLA from public entity endpoints. No SSRF implementation or file-upload stream exists to assess; these capabilities are absent rather than secure.

## 8. Database audit

The high-level relationships are reasonable: joined `Users`/`Candidates`; applications link candidates and offers; offers link forms; forms own fields/options/conditions; applications own responses/documents; interviews link applications and evaluations. However, duplicate entity maps make the effective schema indeterminate until the backend is consolidated and booted.

Required improvements:

- Use migrations and consistent snake_case join columns (`formId` is currently inconsistent).
- Index all foreign keys and common filters: normalized user email (unique), offer status/publication/deadline, application candidate/offer/status/stage/submission time, field form/order, option field/order, condition source/target, interview application/schedule/status, document application/status, talent candidate/status, notification recipient/read/created.
- Add unique keys for candidate+offer application, form+display order (or a stable rank strategy), field+option order/value, and one evaluation per interview.
- Add checks for positive positions/duration/file size, valid score/rating ranges, min≤max, and deadline/publication ordering.
- Add optimistic `@Version` to collaborative/editable aggregates.
- Define deletion/retention: likely soft-delete users/offers/applications where legally required, but purge candidate PII/documents according to consent and jurisdiction. Soft delete should not replace auditable retention policy.
- Use UTC instants/offset-aware types for scheduled events and audit timestamps.

## 9. Security report

### Critical

- Anonymous full API access (F-02).
- Password exposure/mass assignment and role escalation (F-03).
- Contradictory persistence models can corrupt or expose data (F-01).

### High

- Forgeable/deletable audit trail (F-04).
- Tracked secrets and known local DB password (F-05).
- No object-level ownership or tenant isolation; no tenant concept exists.
- No secure document subsystem.
- No rate limiting/anti-automation for auth, applications, or write endpoints.
- No controlled database migrations/backup recovery.

### Medium

- CSRF is disabled. This may be acceptable only for a correctly implemented bearer-token API that never authenticates by ambient cookies; that architecture is not implemented.
- No explicit CORS, CSP, HSTS, frame, referrer, permissions, or production TLS/edge configuration.
- No sensitive-log/redaction policy; SQL logging defaults true and can expose recruitment data/parameters in operational logs.
- No dependency/security scanning, SBOM, image scanning, or patch policy.
- No account verification, recovery, MFA, lockout, session revocation, key rotation, or password policy.
- No PII classification, encryption-at-rest/key-management evidence, retention/consent/export/deletion workflow.

### Low

- Public Swagger/API docs increase reconnaissance exposure; restrict or separately publish a sanitized contract.
- Runtime Google Font request expands third-party/privacy surface.
- Error text is not yet consistently sanitized/correlated.

## 10. Performance and scalability report

The frontend bundle itself is not the expected bottleneck. Database and serialization behavior are.

| Load | Expected behavior without changes |
|---|---|
| 100 users | Prototype may appear responsive with small tables; lazy serialization, broken wiring, and missing connection/runtime config remain blockers. |
| 1,000 users | `findAll` response sizes and N+1 queries become visible; simultaneous studio edits have lost-update risk; single backend/database and no cache/queue limit throughput. |
| 10,000 users | Heap/GC and database scans/connection contention dominate; synchronous notification/document work cannot scale; lack of rate limits enables exhaustion. |
| 100,000 users | Current design is operationally untenable: no horizontal-deployment definition, async pipeline, partition/archival policy, cache, capacity model, SLOs, or load evidence. |

Priorities are pagination/projections/indexes, then query-count and load tests, then caching only for measured read-heavy public form/offer definitions. Use asynchronous durable jobs for notification delivery and document scanning. Avoid premature microservices; a coherent modular monolith plus PostgreSQL, object storage, and a queue is appropriate at this maturity.

## 11. DevOps, reliability, and testing

Production readiness is minimal. Compose proves only a local Postgres concept and publishes it on host port 5432. There is no app service or health dependency. The database volume persists locally, but a volume is not a backup.

Minimum release pipeline: clean checkout → pinned JDK/Node → backend compile/unit/integration/context tests → frontend typecheck/unit/E2E/build → lint/format → secret/SAST/dependency/license/SBOM scans → immutable images → migration validation → staging smoke/security/accessibility tests → approval → progressive production rollout → automated smoke/rollback. Protect artifacts and require review for migrations/security policy.

Observability should include JSON logs with trace/request/user/tenant identifiers and PII redaction; HTTP/JVM/pool/query/queue/business metrics; distributed tracing for DB and integrations; liveness/readiness/startup probes; dashboards and alerts tied to availability, latency, errors, saturation, failed deliveries, stuck applications, and backup failures. Define SLOs and on-call ownership before launch.

Backup/DR needs encrypted automated PostgreSQL backups with point-in-time recovery, object-storage versioning, retention policy, cross-failure-domain copies, quarterly restore drills, and explicit RPO/RTO. None is present.

### Verification results

- `frontend`: `npm.cmd run build` **passed**. Vite transformed 29 modules; JS 201.11 KB (63.10 KB gzip), CSS 11.22 KB (3.48 KB gzip).
- `backend`: `.\mvnw.cmd test` **could not start**. The wrapper fails at `mvnw.cmd:92` by indexing `(Get-Item ...).Target[0]` when `Target` is null. System `mvn` is unavailable. Static inspection additionally identifies interface/type contradictions that should fail compilation.
- No test coverage report can be produced because no coverage tooling exists and the only backend test is a context smoke test.

## 12. Documentation audit

There is no README, setup guide, architecture document, API usage guide, deployment runbook, ADR, threat model, data dictionary, migration guide, environment variable reference, backup/restore procedure, incident runbook, privacy/retention policy, or contributor guide. Swagger annotations cover only some DTO controllers. Required information that cannot be inferred—and must be supplied by product/engineering—is tenancy model, supported identity provider/session strategy, jurisdictions and retention rules, deployment target, availability/RPO/RTO objectives, peak workload/data-volume estimates, notification/storage vendors, and role/approval matrix.

## 13. Production-readiness scorecard

| Category | Score / 100 | Basis |
|---|---:|---|
| Architecture | 28 | Sensible domain concepts, but duplicated models and disconnected tiers |
| Code quality | 35 | Some clean DTO services; inconsistent generations and conventions |
| Security | 8 | All APIs public; password/role entity exposure; secrets tracked |
| Scalability | 20 | Stateless-looking API, but no paging/index strategy/queue/capacity design |
| Performance | 35 | Small frontend; backend query/serialization controls absent |
| Reliability | 12 | No resilience, health, backup/restore, SLOs, or recovery evidence |
| Monitoring | 2 | No operational telemetry stack |
| DevOps | 12 | Local DB Compose only; build wrapper broken; no CI/deployment |
| Testing | 5 | One context test, no frontend tests, backend test not runnable |
| Documentation | 8 | Local comments and partial OpenAPI only |
| UX | 38 | Attractive prototype; inaccessible/nonresponsive and mostly simulated |
| Product maturity | 25 | Broad conceptual model, few complete user outcomes |
| **Overall** | **24** | Weighted judgement emphasizing security, correctness, and operability |

## 14. Prioritized technical debt and roadmap

### Quick wins (<1 day each)

| Priority | Work | Impact / risk | Difficulty / effort |
|---|---|---|---|
| P0 | Disable or label fake saved/publish/auth controls | Prevents user deception/data loss | Low, 0.5 day |
| P0 | Rotate committed credentials; untrack `.env`, `node_modules`, `dist`; expand `.gitignore` | Reduces secret/repository risk | Low, 0.5–1 day |
| P0 | Repair Maven wrapper null-target logic and pin verified toolchain | Restores reproducible build | Low, 0.5 day |
| P1 | Default SQL logging off and define environment profiles | Reduces PII leakage/noise | Low, hours |
| P1 | Correct source encoding and naming (`recrutment`, mojibake) | Improves API/UI trust and DX | Low, 0.5–1 day |
| P1 | Remove duplicate dependencies and unused JWT libraries until used | Reduces drift/attack surface | Low, hours |

### Short term (1–2 weeks)

1. Consolidate duplicate entities/services/repositories and make the backend compile/start/test against Testcontainers.
2. Define API contracts; convert every entity endpoint to validated DTOs and one problem format.
3. Implement identity, password hashing, deny-by-default RBAC and ownership tests.
4. Introduce baseline migrations, core constraints/indexes, pagination, and optimistic locking.
5. Add CI, lint/format, dependency/secret scanning, SBOM, and artifact builds.
6. Establish high-risk unit/integration/API authorization tests.

### Medium term (1–2 months)

1. Integrate frontend using a typed API/query layer; real authentication, autosaved/versioned form drafts, preview and publish.
2. Implement complete candidate offer/application/status and HR review/interview/evaluation workflows.
3. Build secure object storage upload/download with scanning and retention.
4. Implement queued notification delivery and immutable server audit events.
5. Containerize/deploy with TLS, probes, telemetry, alerts, backup/restore, runbooks, and staged rollback.
6. Complete responsive WCAG-oriented component system and E2E/accessibility testing.

### Long term

- Add organization/tenant isolation only after requirements are explicit; enforce tenant ID in data and authorization boundaries.
- Add reporting/search, consent/privacy automation, SSO/SCIM/MFA and enterprise administration.
- Capacity-test and evolve read replicas, caching, archival/partitioning, and worker scaling from measurements.
- Consider billing/AI only after core recruitment integrity, privacy, and operability are mature. AI ranking introduces bias/explainability/governance obligations and should not be a quick feature.

## 15. Top 20 highest-priority improvements

1. Make one coherent application domain and remove duplicate JPA/service trees.
2. Restore a clean, reproducible backend build and context test.
3. Deny `/api/**` by default and implement authentication.
4. Enforce ADMIN/HR/INTERVIEWER/CANDIDATE RBAC and object ownership.
5. Remove password/role/status from public entity binding and responses; hash passwords.
6. Rotate/untrack repository secrets and add automated secret scanning.
7. Replace Hibernate `update` with versioned migrations.
8. Add core FK/unique/check constraints and indexes.
9. Make all endpoints DTO-only with consistent validation/problem responses.
10. Add pagination/limits/projections to every collection endpoint.
11. Connect the frontend to real persistence and truthful save/publish state.
12. Implement tested application and offer state transitions/idempotency.
13. Build secure document storage, validation, scanning, and authorization.
14. Make audit logging server-generated, append-only, protected, and redacted.
15. Build durable queued notifications with recipient/status/retry models.
16. Establish Testcontainers integration, MVC security, frontend unit, and E2E suites.
17. Add CI/CD with quality/security gates and immutable artifacts.
18. Add production deployment, TLS, health probes, structured logs, metrics, traces, SLO alerts.
19. Implement automated backups, point-in-time recovery, restore drills, and rollback runbooks.
20. Redesign the studio responsively and meet keyboard/screen-reader/reduced-motion requirements.

## 16. Actionable launch checklist

- [ ] Clean checkout builds both applications without local-global tools.
- [ ] Backend context and migration tests pass on PostgreSQL.
- [ ] No duplicate entity/table or service implementations remain.
- [ ] Public endpoint allowlist is documented; all other routes require authenticated authorization.
- [ ] Candidate data is ownership/tenant scoped and passwords never serialize.
- [ ] Secrets are rotated, externally injected, and absent from repository/history/build logs.
- [ ] Migrations, constraints, indexes, rollback/restore procedure are reviewed.
- [ ] Every list is paginated and load-tested at agreed peak volumes.
- [ ] Frontend authentication/save/preview/publish reflects server truth and handles errors/offline/conflicts.
- [ ] Uploads use object storage, type/size validation, malware scanning, protected download URLs, retention.
- [ ] Audit events are immutable and notifications are durable/retryable.
- [ ] Unit/integration/security/E2E/accessibility tests gate merges.
- [ ] Images/SBOM/scans are produced and deployments are reproducible.
- [ ] Health, logs, metrics, traces, dashboards, SLO alerts, and on-call runbooks exist.
- [ ] Backup restoration and rollback are demonstrated in staging.
- [ ] Privacy, consent, retention, deletion/export, and incident response are approved.
- [ ] Architecture, setup, API, operations, and ADR documentation is current.

**Decision:** No-go for production. Reassess after P0/P1 short-term work produces a clean build, passing security/integration tests, a migrated database, and an end-to-end persisted workflow in a production-like staging environment.
