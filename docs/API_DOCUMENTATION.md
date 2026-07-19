# testaz Backend — API Reference for Frontend Integration

> Base URL: `http://192.168.100.39:8080`. All endpoints are prefixed `/api/v1`.
> Swagger UI is live at `/swagger-ui.html` (OpenAPI JSON at `/v3/api-docs`).
> The canonical frontend snapshot is the repository-root `openapi.yaml`; it was synchronized with
> the live API on 2026-07-19 and contains 105 paths, 122 operations, and 191 schemas.
>
> This document supplements that contract with integration guidance. When endpoint or schema detail
> differs, use the live Swagger/OpenAPI contract as the source of truth.

---

## Table of contents

1. [Security model (read this first)](#1-security-model-read-this-first)
2. [Standard response envelopes](#2-standard-response-envelopes)
3. [Error format & error codes](#3-error-format--error-codes)
4. [Rate limiting](#4-rate-limiting)
5. [Enums reference](#5-enums-reference)
6. [Endpoints — Authentication](#6-endpoints--authentication)
7. [Endpoints — Taxonomy (subjects/grades/topics/exams)](#7-endpoints--taxonomy-subjectsgradestopicsexams)
8. [Endpoints — Student](#8-endpoints--student)
9. [Endpoints — Parent](#9-endpoints--parent)
10. [Endpoints — Organization](#10-endpoints--organization)
11. [Endpoints — Test sessions (taking a test)](#11-endpoints--test-sessions-taking-a-test)
12. [Endpoints — Results](#12-endpoints--results)
13. [Endpoints — Notifications](#13-endpoints--notifications)
14. [Endpoints — Admin: Questions](#14-endpoints--admin-questions)
15. [Endpoints — Admin: AI generation](#15-endpoints--admin-ai-generation)
16. [CORS](#16-cors)

---

## 1. Security model (read this first)

### 1.1 Two separate filter chains

Spring Security registers **two ordered `SecurityFilterChain`s**:

| Chain | Order | Matches | Requirement |
|---|---|---|---|
| Admin chain | 1 | `/api/v1/admin/**` | `ROLE_ADMIN` on **every** request, no exceptions |
| Main API chain | 2 | everything else | public allow-list, else must be authenticated |

The admin chain matches first — if a request's path starts with `/api/v1/admin/`, it is judged
**solely** on whether the caller has `ROLE_ADMIN`, before any controller-level `@PreAuthorize` even
runs. There is no way to reach an admin endpoint without that role in the token.

Both chains are **stateless** (`SessionCreationPolicy.STATELESS`, CSRF disabled) — there is no
server-side session or cookie. Every request must carry its own credentials via the
`Authorization: Bearer <accessToken>` header.

### 1.2 Public paths (no token required)

Only these paths are reachable without a JWT:

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/verification/**   (send, confirm)
POST /api/v1/auth/password/**       (forgot, reset)
POST /api/v1/payments/webhook       (public, HMAC signature verified)
GET  /api/v1/ping
GET  /api/v1/subscriptions/plans
GET  /api/v1/subjects/**
GET  /api/v1/grades
GET  /api/v1/exam-definitions/**
GET  /swagger-ui.html, /swagger-ui/**, /v3/api-docs/**
GET  /actuator/health, /actuator/health/**, /actuator/info
/error
```

**Everything else — including `POST /api/v1/auth/logout` and `GET /api/v1/auth/me` — requires a
valid access token.** Logout is intentionally NOT public.

### 1.3 How a request is authenticated (JWT flow)

1. Client sends `Authorization: Bearer <accessToken>`.
2. `JwtAuthenticationFilter` (runs on every request, before Spring's own auth filter) does, in order:
   - Verifies the RS256 signature and expiry of the token.
   - Checks the token's `jti` claim against a Redis blacklist (populated on logout) — a token that
     has been logged out is rejected even if it hasn't expired yet.
   - If valid, builds a `UserPrincipal` (implements Spring's `UserDetails`) directly from the
     token's claims — **no database lookup per request.** The principal's authorities come straight
     from the token's `roles` claim (each role becomes `ROLE_<CODE>`, e.g. `ROLE_ADMIN`).
3. If the token is missing/invalid/expired/blacklisted, the request proceeds as **unauthenticated**.
   Accessing a protected path with no valid authentication returns **401** (via
   `RestAuthenticationEntryPoint`); accessing a path the user's role doesn't permit returns **403**
   (via `RestAccessDeniedHandler`). Both return the standard JSON `ErrorResponse` shape (§3), never
   a default Spring/servlet error page.

### 1.4 Token lifetimes

| Token | Type | Lifetime (default) | Where used |
|---|---|---|---|
| Access token | RS256 JWT | 15 minutes | `Authorization: Bearer <token>` on every authenticated request |
| Refresh token | Opaque random string | 7 days | `POST /api/v1/auth/refresh` body, to mint a new access+refresh pair |

Access token claims: `sub` (user UUID), `roles` (array of role codes, e.g. `["STUDENT"]`), `jti`
(unique token id, used for blacklist/revocation), `iat`/`exp`.

**Frontend implication:** decode the JWT payload (base64, no crypto needed) or call `GET
/api/v1/auth/me` to read `roles` and drive UI (e.g. show/hide an admin dashboard link). This is
**purely cosmetic** — it does not grant or restrict any actual access; the server enforces
everything independently regardless of what the frontend does with this information.

**Refresh rotation:** every successful `/auth/refresh` call issues a **new** access+refresh pair and
invalidates the old refresh token's family. Reusing an already-rotated (revoked) refresh token
revokes the entire token family server-side (reuse-detection — a signal of possible token theft).
Store the latest refresh token only; discard the old one immediately after a successful refresh.

**Logout:** `POST /api/v1/auth/logout` (requires a valid access token) blacklists that access
token's `jti` (so it stops working immediately, before its natural 15-minute expiry) and revokes the
refresh token family passed in the body. Always call logout rather than just deleting local tokens,
so the access token can't be replayed by anyone who captured it.

### 1.5 Role-Based Access Control (RBAC) — what each endpoint requires

Every protected endpoint declares its allowed role(s) via `@PreAuthorize` at the controller/method
level (defense-in-depth on top of the filter chain). Roles are mutually non-exclusive — a user can
hold more than one (e.g. `PARENT` and `SCHOOL_TEACHER` at once); `roles` in the JWT is a **set**.

| Role | Can call |
|---|---|
| `STUDENT` | `/students/me/**`, `/sessions/**`, `/sessions/{id}/result`, `/results`, `/organizations/invites/{code}/redeem` |
| `PARENT` | `/parents/me/**` |
| `COURSE`, `PRIVATE_TUTOR`, `SCHOOL_TEACHER` | `/organizations` (create), `/organizations/me`, `/organizations/{orgId}/**` (owner-only management) |
| `ADMIN` | everything under `/api/v1/admin/**` |
| *(any authenticated role)* | `/auth/logout`, `/auth/me`, `/notifications/**` |

`ADMIN` **cannot be self-assigned at registration** — `RegisterRequest.role` rejects `ADMIN` at the
service layer regardless of what the client sends.

### 1.6 Beyond RBAC — ownership / relationship checks (important nuance)

**Role alone is never sufficient for data that belongs to a specific person.** A role check answers
"is this user *a* parent" — it does NOT answer "is this parent allowed to see *this* child's data."
The backend enforces a **second layer**, in the service, for every relationship-scoped read:

- **Parent → child data:** every `/parents/me/children/{studentId}/**` call is gated on an
  `existsByParentIdAndStudentIdAndStatus(parentId, studentId, ACTIVE)` check. A parent with no
  active link to that student gets nothing (404/403), regardless of their `PARENT` role.
- **Student → own session/result:** `/sessions/{id}` and `/sessions/{id}/result` check that the
  session's `studentId` equals the caller's user id.
- **Org owner → org data:** every `/organizations/{orgId}/**` management call checks
  `existsByIdAndOwnerUserId(orgId, callerUserId)`. Owning *an* organization is not enough — you must
  own *this* organization.

**Frontend implication:** a 403/404 on a resource-scoped endpoint (e.g. a child's results, another
org's dashboard) is expected and correct behavior for a user who lacks the relationship — it is not
necessarily a bug. Don't assume "logged in with the right role" implies "will succeed"; always
handle the error response.

### 1.7 Password & account security

- Passwords are hashed with **BCrypt (strength 12)** — never stored or logged in plaintext, never
  echoed back in any response.
- Registration creates a `PENDING` user; login is still allowed while `PENDING` (verification is a
  separate flag, not a login gate) — but expect product-level UI gating for unverified accounts if
  the product requires it.
- OTP/verification codes are single-use, time-limited, and compared with a constant-time check
  server-side (timing-attack resistant).
- `verification/send` and `password/forgot` **always return 202** whether or not the account exists
  — this is deliberate (prevents account enumeration by response difference). Don't infer account
  existence from the response; the OTP simply won't arrive if there's no matching account.

### 1.8 Transport-level hardening (informational — no frontend action needed)

- `X-Frame-Options: DENY`, a `Content-Security-Policy`, and HSTS (prod) are set on every response.
- CORS is locked to an explicit allow-list of origins (§16) — wildcard origins are never used.
- In production, the app trusts `X-Forwarded-For` for rate-limit keying only when it's confirmed to
  sit behind a proxy (`app.rate-limit.trust-forwarded-header=true`); this has no effect on your
  requests other than which "bucket" your rate limit is tracked under.

---

## 2. Standard response envelopes

**Every successful single-object response** is wrapped:

```json
{
  "data": { /* the actual payload */ },
  "message": "optional human-readable note, or absent if null",
  "timestamp": "2026-07-02T10:15:30Z"
}
```

**Every list/paginated response** wraps its content in `PageResponse` (nested inside `data`):

```json
{
  "data": {
    "content": [ /* array of items */ ],
    "page": 0,
    "size": 20,
    "totalElements": 143,
    "totalPages": 8,
    "hasNext": true
  },
  "message": null,
  "timestamp": "2026-07-02T10:15:30Z"
}
```

Pagination query params: `page` (0-indexed, default `0`), `size` (default `20`, **hard max 100** —
values outside range are clamped server-side, never a 500).

Some endpoints return **no body** (`204 No Content`) — e.g. logout, mark-as-read, approve/reject a
question. Treat these as fire-and-forget on success; check the HTTP status, not a payload.

---

## 3. Error format & error codes

Every error — validation failure, not-found, auth failure, unexpected exception — returns the
**same JSON shape**, never a raw stack trace or a default framework error page:

```json
{
  "timestamp": "2026-07-02T10:15:30Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "path": "/api/v1/auth/register",
  "traceId": "a1b2c3d4",
  "fieldErrors": [
    { "field": "email", "message": "must be a well-formed email address" }
  ]
}
```

`fieldErrors` is `null` unless the failure was a body-validation error. `traceId` is safe to show
to users ("reference code") and to log client-side — it correlates with the server's internal log
line for support/debugging, without exposing internals.

### Error code table

| `code` | HTTP status | Meaning | Typical cause |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body failed `@Valid` constraints | Missing required field, string too long, bad format |
| `MALFORMED_REQUEST` | 400 | Body isn't valid JSON, or a path/query param has the wrong type | Sending a string where a UUID/enum is expected |
| `UNAUTHORIZED` | 401 | No valid authentication | Missing/expired/blacklisted token |
| `FORBIDDEN` | 403 | Authenticated, but not allowed | Wrong role, or right role but no ownership/relationship (§1.6) |
| `RESOURCE_NOT_FOUND` | 404 | Entity doesn't exist (or, for isolation, "doesn't exist to you") | Bad id, or someone else's resource — see below |
| `CONFLICT` | 409 | State conflict / duplicate | Re-registering an email, DB unique-constraint race |
| `BUSINESS_RULE_VIOLATION` | 422 | Semantically invalid request | Starting an exam with too few bank questions, illegal review-state transition |
| `RATE_LIMITED` | 429 | Too many requests from this IP for this endpoint class | See §4 |
| `EXTERNAL_SERVICE_ERROR` | 503 | An upstream dependency (Claude API) is down | AI generation call failed after retries |
| `INTERNAL_ERROR` | 500 | Unexpected server fault | Bug — should be rare; report the `traceId` |

**Important isolation nuance:** for privacy-sensitive lookups (e.g. a parent trying to view a
session that isn't theirs, or that belongs to a student they aren't linked to), the backend
deliberately returns the **same 403/404** it would for a genuinely nonexistent resource — it does
not leak whether the resource exists but is just not yours. Don't build UI logic that distinguishes
"doesn't exist" from "exists but not yours" based on status code alone.

`code` values are a stable contract — the frontend can safely `switch` on them (e.g. to show a
localized message per code) without needing to parse `message` text.

---

## 4. Rate limiting

Applied **only to specific auth-related POST endpoints**, keyed per client IP (not per user — these
endpoints run before authentication):

| Policy | Applies to | Default limit |
|---|---|---|
| `OTP` | `POST /auth/verification/send`, `POST /auth/password/forgot` | 5 requests / 15 minutes |
| `AUTH` | `POST /auth/login`, `/auth/register`, `/auth/refresh`, `/auth/verification/confirm`, `/auth/password/reset` | 30 requests / minute |

All other endpoints are **not** rate-limited at this layer. Exceeding a limit returns `429` with
`code: "RATE_LIMITED"` (same `ErrorResponse` shape as §3). The frontend should back off and, ideally,
surface a "too many attempts, try again shortly" message rather than retrying immediately.

---

## 5. Enums reference

Enum values are serialized as their exact Java name (JSON string), case-sensitive.

```
RoleCode:            STUDENT, PARENT, COURSE, PRIVATE_TUTOR, SCHOOL_TEACHER, ADMIN
UserStatus:          PENDING, ACTIVE, SUSPENDED, DELETED
QuestionType:         SINGLE_CHOICE, MULTIPLE_CHOICE, SHORT_TEXT
Difficulty:           EASY, MEDIUM, HARD
QuestionStatus:       DRAFT, PENDING_REVIEW, ACTIVE, REJECTED, ARCHIVED
AnswerMatchType:      EXACT, NORMALIZED, NUMERIC, REGEX
TestType:             PRACTICE, OFFICIAL_EXAM, CUSTOM
SessionStatus:        IN_PROGRESS, SUBMITTED, EXPIRED, ABANDONED
ScoringMode:          PERCENTAGE, EXAM_WEIGHTED, SECTION_WEIGHTED
WeakAreaLevel:        SUBJECT, TOPIC
WeakAreaSeverity:     NONE, LOW, MEDIUM, HIGH, CRITICAL
ExamCode:             BURAXILIS, QEBUL
OrganizationType:     COURSE, PRIVATE_TUTOR, SCHOOL
OrganizationStatus:   ACTIVE, ARCHIVED
MemberStatus:         ACTIVE, REMOVED
InviteStatus:         ACTIVE, DISABLED
LinkInvitationStatus: PENDING, ACCEPTED, REJECTED, CANCELLED
NotificationType:     RESULT_READY, CHILD_TEST_COMPLETED, PARENT_LINK_INVITED,
                      PARENT_LINK_ACCEPTED, PARENT_LINK_REJECTED, EXAM_ASSIGNED,
                      ORG_TEST_COMPLETED
```

---

## 6. Endpoints — Authentication

Base: `/api/v1/auth`. See §1.2 for which of these are public.

### `POST /auth/register` — public
Creates a `PENDING` account. `ADMIN` role is rejected server-side even if sent.

**Body (`RegisterRequest`):**
```json
{
  "fullName": "string, required, max 150",
  "email": "string, optional, valid email, max 255",
  "phone": "string, optional, E.164-ish: ^\\+?[0-9]{7,15}$, max 32",
  "password": "string, required, 8-100 chars",
  "role": "STUDENT | PARENT | COURSE | PRIVATE_TUTOR | SCHOOL_TEACHER"
}
```
At least one of `email`/`phone` is required (enforced in the service, not by DTO annotation).

**Response `201`:** `{ "userId": "uuid", "status": "PENDING" }`

### `POST /auth/login` — public
**Body (`LoginRequest`):** `{ "login": "email or phone, required", "password": "required" }`
**Response `200` (`AuthTokensResponse`):**
```json
{ "accessToken": "jwt", "refreshToken": "opaque", "tokenType": "Bearer", "expiresIn": 900, "refreshExpiresIn": 604800 }
```

### `POST /auth/refresh` — public
**Body:** `{ "refreshToken": "required" }`
**Response `200`:** same `AuthTokensResponse` shape — **replace both stored tokens** with the new pair.

### `POST /auth/logout` — requires auth
**Body:** `{ "refreshToken": "required" }` — **Response `204`**. Blacklists the caller's current
access token and revokes the whole refresh-token family.

### `GET /auth/me` — requires auth
**Response `200` (`MeResponse`):** `{ "userId": "uuid", "roles": ["STUDENT"] }`

### `POST /auth/verification/send` — public, OTP rate-limited
**Body:** `{ "login": "required" }` → **Response `202`**, no body. Always 202 regardless of account existence.

### `POST /auth/verification/confirm` — public, AUTH rate-limited
**Body:** `{ "login": "required", "code": "required" }` → **Response `204`**. Activates the account.

### `POST /auth/password/forgot` — public, OTP rate-limited
**Body:** `{ "login": "required" }` → **Response `202`**, no body.

### `POST /auth/password/reset` — public, AUTH rate-limited
**Body:** `{ "login": "required", "code": "required", "newPassword": "required, 8-100 chars" }` → **Response `204`**.

---

## 7. Endpoints — Taxonomy (subjects/grades/topics/exams)

All public, all cached (Redis) server-side — safe to call often; no auth needed.

### `GET /api/v1/subjects`
**Response `200`:** `List<SubjectResponse>` → `{ id: short, code: string, nameAz: string, nameEn: string }`

### `GET /api/v1/grades`
**Response `200`:** `List<GradeResponse>` → `{ id: short, code: string, nameAz: string, level: int }`

### `GET /api/v1/subjects/{code}/topics`
`{code}` is a `SubjectCode` enum value (e.g. `MATH`, `PHYSICS`, `AZ_LANG`, etc.).
**Response `200`:** `List<TopicResponse>` → `{ id: int, code: string, nameAz: string, parentTopicId: int|null }`

### `GET /api/v1/exam-definitions`
**Response `200`:** `List<ExamDefinitionSummaryResponse>`:
```json
{ "code": "BURAXILIS", "nameAz": "...", "totalQuestions": 85, "durationMinutes": 180, "maxScore": 300, "negativeMarkingDivisor": null }
```

### `GET /api/v1/exam-definitions/{code}`
`{code}` = `BURAXILIS` or `QEBUL`.
**Response `200`:** `ExamDefinitionResponse` — the summary above plus `groups`:
```json
{
  "code": "QEBUL", "nameAz": "...", "totalQuestions": 90, "durationMinutes": 180, "maxScore": 400, "negativeMarkingDivisor": 4,
  "groups": [
    {
      "code": "I_RI", "displayName": "...", "orderIndex": 1,
      "subjects": [
        { "subjectCode": "MATH", "slotIndex": 0, "languageChoice": false, "questionCount": 30, "closedCount": 22, "openCount": 8, "maxPoints": 150 }
      ]
    }
  ]
}
```
Use this to render exam-selection UI (which groups/subjects are available, and how questions are weighted).

---

## 8. Endpoints — Student

Base: `/api/v1/students/me`. **Requires `STUDENT` role.** Profile auto-creates on first access (no
separate "create profile" step needed).

### `GET /students/me`
**Response `200` (`StudentProfileResponse`):** `{ "id": "uuid (= userId)", "gradeId": short|null, "guardianConsent": boolean }`

### `PUT /students/me`
Partial update — only send fields you want to change; `null`/omitted fields are left as-is.
**Body (`UpdateStudentProfileRequest`):** `{ "gradeId": short|null, "guardianConsent": boolean|null }`
**Response `200`:** updated `StudentProfileResponse`.

### `GET /students/me/invitations`
Lists parent-link invitations received by the learner. Optional `status` query parameter; the
default is `PENDING`.
**Response `200`:** `List<InvitationResponse>`.

### `POST /students/me/invitations/{invitationId}/respond`
Accepts or rejects an invitation.
**Body (`RespondInvitationRequest`):** `{ "accept": true|false }`
**Response `200` (`InvitationDecisionResponse`):** includes `invitationId`, `status`, `approved`,
`parentId`, and `learnerId`.

### `GET /students/me/parents`
Lists parents currently linked to the learner.
**Response `200`:** `List<LinkedParentResponse>`.

### `DELETE /students/me/parents/{parentId}`
Withdraws consent and immediately ends that parent's access. **Response `204`.**

---

## 9. Endpoints — Parent

Base: `/api/v1/parents/me`. **Requires `PARENT` role.** Every child-data read is additionally gated
on an ACTIVE link to that specific student (§1.6) — role alone does not grant access.

### `GET /parents/me`
**Response `200` (`ParentProfileResponse`):** `{ "id": "uuid", "notifyOnChildResult": boolean }`

### `PUT /parents/me`
**Body (`UpdateParentProfileRequest`):** `{ "notifyOnChildResult": boolean|null }` (partial)
**Response `200`:** updated `ParentProfileResponse`.

### `POST /parents/me/invitations`
Sends a relationship invitation to a learner.
**Body (`SendInvitationRequest`):** `{ "learnerId": "required uuid", "message": "optional, max 500" }`
**Response `201`:** `InvitationResponse`.

### `GET /parents/me/invitations`
Lists invitations sent by the parent. Optional `status` query parameter; the default is `PENDING`.
**Response `200`:** `List<InvitationResponse>`.

### `DELETE /parents/me/invitations/{invitationId}`
Cancels a pending invitation sent by the current parent. **Response `204`.**

### `DELETE /parents/me/links/{studentId}`
Revokes the link — immediately cuts off all access to that child's data. **Response `204`.**
A fresh invitation can re-establish the relationship later.

### `GET /parents/me/children`
**Response `200`:** `List<LinkedChildResponse>` (unpaginated — a parent has few children).

### `GET /parents/me/children/{studentId}/results`
Paginated (`page`, `size`), newest first.
**Response `200`:** `PageResponse<ResultSummaryResponse>` (see §12 for the shape).

### `GET /parents/me/children/{studentId}/sessions/{sessionId}/result`
**Response `200`:** full `ResultResponse` (§12) for that specific session — same shape a student
gets for their own result, including the per-question breakdown and weak areas.

### `GET /parents/me/children/{studentId}/trends`
Returns cumulative subject accuracy and trend direction for a linked child.
**Response `200`:** `List<SubjectTrendResponse>`.

### `GET /parents/me/children/{studentId}/topic-trends`
Returns cumulative topic accuracy and trend direction for a linked child.
**Response `200`:** `List<TopicTrendResponse>`.

---

## 10. Endpoints — Organization

Base: `/api/v1/organizations`. For courses / private tutors / school teachers running group tests.

### `POST /organizations` — roles: `COURSE`, `PRIVATE_TUTOR`, `SCHOOL_TEACHER`
Creates an org; the caller becomes its owner.
**Body (`CreateOrganizationRequest`):** `{ "type": "COURSE|PRIVATE_TUTOR|SCHOOL", "name": "required, max 200" }`
**Response `201` (`OrganizationResponse`):** `{ "id": "uuid", "type": "...", "name": "...", "status": "ACTIVE" }`

### `GET /organizations/me` — owner roles
**Response `200`:** `List<OrganizationResponse>` (unpaginated — an owner has few orgs).

### `POST /organizations/{orgId}/invites` — owner-only (must own `orgId`)
Assembles a fixed set of questions from the bank into a test, and creates a shareable join code.
**Body (`CreateInviteRequest`):**
```json
{
  "title": "optional, max 200",
  "description": "optional, max 2000",
  "subjectId": "required (short id)",
  "gradeId": "optional (short id)",
  "topicId": "optional (int id)",
  "difficulty": "required: EASY|MEDIUM|HARD",
  "questionCount": "required, 1-100",
  "durationMinutes": "optional, 1-600",
  "maxUses": "optional, 1-10000 (null = unlimited)",
  "ttlHours": "optional, 1-8760 (null = server default)"
}
```
**Response `201` (`InviteResponse`):**
```json
{ "id": "uuid", "code": "8-char string", "testId": "uuid", "maxUses": 30, "usedCount": 0, "expiresAt": "instant", "status": "ACTIVE" }
```
Fails with `BUSINESS_RULE_VIOLATION` (422) if the bank doesn't have enough ACTIVE questions matching
`subjectId`+`difficulty` to fill `questionCount`.

### `GET /organizations/{orgId}/members` — owner-only, paginated
**Response `200`:** `PageResponse<MemberResponse>` → `{ studentId, gradeId, status, joinedAt }` per row.

### `GET /organizations/{orgId}/tests/{testId}/results` — owner-only, paginated
Dashboard of every member's result for that test.
**Response `200`:** `PageResponse<TestResultSummaryResponse>` (like `ResultSummaryResponse` but with
a `studentId` field to identify whose result it is). Requires the test to have actually been
invited within this org (`{orgId}` + `{testId}` combination checked).

### `POST /organizations/invites/{code}/redeem` — role: `STUDENT`
Single call that both **joins** the org (auto-adds membership, snapshotting the student's current
grade) and **starts or resumes** the invited test session.
**Response `200` (`SessionResponse`):** the take view (§11) — same shape as starting any session.
Errors: unknown code → 404; expired/disabled/use-cap-exceeded → 409/422. Re-redeeming by an existing
member is idempotent (returns/resumes the same session, does not double-consume the invite's
`maxUses`).

---

## 11. Endpoints — Test sessions (taking a test)

Base: `/api/v1/sessions`. **Requires `STUDENT` role.** Ownership of the session (caller ==
`studentId`) is checked on every call.

### `POST /sessions` — start a session
**Body (`StartSessionRequest`):**
```json
{
  "type": "PRACTICE | CUSTOM | OFFICIAL_EXAM",
  "subjectId": "short id — required for PRACTICE/CUSTOM",
  "topicId": "int id — optional filter",
  "gradeId": "short id — optional",
  "difficulty": "EASY|MEDIUM|HARD — required for PRACTICE/CUSTOM",
  "count": "1-100, optional — defaults server-side for PRACTICE when omitted",
  "examCode": "BURAXILIS|QEBUL — required for OFFICIAL_EXAM",
  "examGroupCode": "string — required for QEBUL (multiple groups); omit for BURAXILIS (single group)"
}
```
**Response `201` (`SessionResponse`):**
```json
{
  "id": "uuid",
  "type": "PRACTICE",
  "status": "IN_PROGRESS",
  "subjectId": 1, "topicId": null, "gradeId": 11, "difficulty": "MEDIUM",
  "totalQuestions": 20, "answeredCount": 0,
  "durationMinutes": null,
  "startedAt": "instant", "expiresAt": "instant|null", "submittedAt": null,
  "questions": [
    {
      "sessionQuestionId": "uuid",
      "orderIndex": 0,
      "subjectId": 1, "slotIndex": null,
      "type": "SINGLE_CHOICE",
      "stem": "question text",
      "options": [ { "optionId": "uuid", "content": "text", "orderIndex": 0 } ],
      "selectedOptionIds": [],
      "answerText": null
    }
  ]
}
```
**Never contains correct-answer information** — this is the take view only. Fails with
`BUSINESS_RULE_VIOLATION` (422) if the bank can't fill the requested count/slots.

### `GET /sessions/{id}` — resume
Same `SessionResponse` shape, but `selectedOptionIds`/`answerText` reflect previously-autosaved
answers, so the frontend can restore in-progress state after a refresh/reconnect.

### `PUT /sessions/{id}/questions/{sessionQuestionId}/answer` — autosave
Call this on every answer change (debounce client-side as appropriate — no explicit rate limit here
but avoid hammering it).
**Body (`SaveAnswerRequest`):**
```json
{ "selectedOptionIds": ["uuid", "..."], "answerText": null }
```
Use `selectedOptionIds` (max 10) for `SINGLE_CHOICE`/`MULTIPLE_CHOICE`; use `answerText` (max 2000
chars) for `SHORT_TEXT`. Send an empty array / null to **clear** a previously saved answer. Sending
&gt;1 option id for a `SINGLE_CHOICE` question, or an option id that doesn't belong to the question, is
rejected with `422`.
**Response `200` (`AnswerAck`):** `{ "answeredCount": 5, "answeredAt": "instant" }`

### `POST /sessions/{id}/submit` — finalize
Marks the session `SUBMITTED` (immutable afterward) and queues **asynchronous scoring** — the
result is *not* immediately ready. **Response `200`:** `SessionResponse` with `status: "SUBMITTED"`.

**Frontend implication:** after submit, poll (or navigate and retry) `GET /sessions/{id}/result`
until it returns `200` rather than `409`. Scoring typically completes within a second or two but is
not synchronous.

---

## 12. Endpoints — Results

Base: `/api/v1`. **Requires `STUDENT` role** (parent access to a *child's* result goes through §9's
parent-scoped endpoints instead, not these directly).

### `GET /sessions/{id}/result`
**Response `200` (`ResultResponse`):**
```json
{
  "id": "uuid", "sessionId": "uuid",
  "type": "PRACTICE", "scoringMode": "PERCENTAGE",
  "totalScore": 18, "maxScore": 20, "percentage": 90.00,
  "totalQuestions": 20, "correctCount": 18, "wrongCount": 2, "blankCount": 0,
  "passed": null, "durationSeconds": 640, "scoredAt": "instant",
  "details": [
    {
      "questionId": "uuid", "subjectId": 1, "topicId": 3, "slotIndex": null, "orderIndex": 0,
      "questionType": "SINGLE_CHOICE",
      "stem": "...", "correctAnswer": "...", "explanation": "...", "studentAnswer": "...",
      "correct": true, "blank": false
    }
  ],
  "weakAreas": [
    {
      "level": "TOPIC", "subjectId": 1, "topicId": 3,
      "totalQuestions": 5, "correctCount": 2, "wrongCount": 3, "blankCount": 0,
      "accuracy": 40.00, "severity": "HIGH", "recommendation": "az-language text",
      "score": null, "maxPoints": null
    }
  ]
}
```
For `OFFICIAL_EXAM` sessions (`scoringMode: "EXAM_WEIGHTED"`), subject-level `weakAreas` rows also
carry `score`/`maxPoints` (the weighted points earned/possible for that subject).

Possible non-200 responses on this endpoint:
- `403` — session belongs to someone else.
- `409` — session exists but isn't submitted yet (`IN_PROGRESS`), or was just submitted and scoring
  hasn't finished (poll again shortly).
- `404` — session doesn't exist (or isn't yours — indistinguishable per §3).

### `GET /results`
Paginated (`page`, `size`), newest first.
**Response `200`:** `PageResponse<ResultSummaryResponse>` — each row:
```json
{ "id": "uuid", "sessionId": "uuid", "type": "PRACTICE", "scoringMode": "PERCENTAGE", "totalScore": 18, "maxScore": 20, "percentage": 90.00, "correctCount": 18, "totalQuestions": 20, "scoredAt": "instant" }
```

---

## 13. Endpoints — Notifications

Base: `/api/v1/notifications`. **Any authenticated role** (`isAuthenticated()`), scoped to the
caller — you only ever see/affect your own notifications.

### `GET /notifications`
Paginated (`page`, `size`), newest first.
**Response `200`:** `PageResponse<NotificationResponse>` — each row:
```json
{ "id": "uuid", "type": "RESULT_READY", "title": "...", "body": "...", "deepLink": "/results/...", "readAt": null, "createdAt": "instant" }
```
`readAt` is `null` while unread.

### `GET /notifications/unread-count`
**Response `200`:** a plain number (e.g. `5`) inside `data` — use for a badge counter.

### `POST /notifications/{id}/read`
Idempotent. **Response `204`.** Someone else's notification id behaves like a 404 (ownership-scoped
lookup, no existence leak).

### `GET /notifications/preferences`
**Response `200` (`NotificationPreferencesResponse`):** `{ "emailEnabled": true, "smsEnabled": false }`
`IN_APP` delivery is always on and not configurable — it's not represented in this response.

### `PUT /notifications/preferences`
Partial update.
**Body (`UpdateNotificationPreferencesRequest`):** `{ "emailEnabled": boolean|null, "smsEnabled": boolean|null }`
**Response `200`:** updated `NotificationPreferencesResponse`.

---

## 14. Endpoints — Admin: Questions

Base: `/api/v1/admin/questions`. **Admin filter chain — `ROLE_ADMIN` only** (§1.1); also carries
`@PreAuthorize("hasRole('ADMIN')")` as defense-in-depth.

### `POST /admin/questions` — create (starts as `DRAFT`)
**Body (`CreateQuestionRequest`):**
```json
{
  "subjectId": "required (short id)",
  "gradeId": "optional (short id)",
  "topicId": "optional (int id)",
  "difficulty": "required: EASY|MEDIUM|HARD",
  "type": "required: SINGLE_CHOICE|MULTIPLE_CHOICE|SHORT_TEXT",
  "stem": "required, max 4000",
  "explanation": "optional, max 4000",
  "language": "optional, two-letter code e.g. 'az' (pattern ^[a-z]{2}$)",
  "options": [
    { "content": "required, max 2000", "correct": true, "orderIndex": 0 }
  ],
  "acceptedAnswers": [
    { "value": "required, max 500", "matchType": "EXACT|NORMALIZED|NUMERIC|REGEX", "caseSensitive": false, "orderIndex": 0 }
  ]
}
```
Both `options` and `acceptedAnswers` arrays are capped at 10 items. **Type-specific rules enforced
server-side (422 if violated):**
- `SINGLE_CHOICE` → exactly one option with `correct: true`.
- `MULTIPLE_CHOICE` → at least one option with `correct: true`.
- `SHORT_TEXT` → at least one accepted answer.

**Response `201` (`QuestionResponse`):** the full question including generated `id`, `status:
"DRAFT"`, `options[]` (each with `id`), `acceptedAnswers[]` (each with `id`), `timesUsed: 0`,
`createdAt`.

### `GET /admin/questions/{id}`
**Response `200`:** `QuestionResponse` (same shape as create's response).

### `GET /admin/questions` — list, filterable, paginated
Query params: `subjectId` (optional short), `status` (optional `QuestionStatus`), `page`, `size`.
**Response `200`:** `PageResponse<QuestionSummaryResponse>` — each row:
```json
{ "id": "uuid", "subjectId": 1, "topicId": null, "difficulty": "MEDIUM", "type": "SINGLE_CHOICE", "status": "DRAFT", "stem": "...", "createdAt": "instant" }
```

### `POST /admin/questions/approve-all`
Moves all `PENDING_REVIEW` questions to `ACTIVE`.
**Response `200` (`BulkApprovalResponse`):** includes the number of questions moved.

### `POST /admin/questions/{id}/reject` → `REJECTED`. **Response `204`.**
### `POST /admin/questions/{id}/archive` → `ARCHIVED`. **Response `204`.**

These enforce the server-side state machine. Approval is now a bulk operation for the
`PENDING_REVIEW` queue; reject and archive remain individual operations.

---

## 15. Endpoints — Admin: AI generation

Base: `/api/v1/admin/ai`. **Admin filter chain — `ROLE_ADMIN` only.**

### `POST /admin/ai/generate` — trigger a generation job (async)
**Body (`GenerateQuestionsRequest`):**
```json
{
  "subjectId": "required (short id)",
  "gradeId": "optional (short id)",
  "topicId": "optional (int id)",
  "difficulty": "required: EASY|MEDIUM|HARD",
  "questionType": "required: SINGLE_CHOICE|MULTIPLE_CHOICE|SHORT_TEXT",
  "count": "required, 1-50"
}
```
**Response `202` (`AiGenerationJobResponse`):**
```json
{
  "id": "uuid", "trigger": "ADMIN_MANUAL",
  "subjectId": 1, "gradeId": 11, "topicId": null,
  "difficulty": "MEDIUM", "questionType": "SINGLE_CHOICE",
  "requestedCount": 10, "generatedCount": 0,
  "status": "QUEUED", "model": "claude-...", "errorMessage": null,
  "createdAt": "instant", "completedAt": null
}
```
The job runs **asynchronously** — generated questions land as `PENDING_REVIEW` in the question bank
(§14) once done; they are never auto-activated. Poll the job for completion.

### `GET /admin/ai/jobs/{id}`
**Response `200`:** `AiGenerationJobResponse`, updated with current `status`/`generatedCount`/`completedAt`.
If the upstream Claude call ultimately fails (after retries), `status` becomes `FAILED` with
`errorMessage` populated — this never surfaces as a raw 503 to the polling client; it's a normal
`200` response describing a failed job.

### `GET /admin/ai/jobs` — paginated, most recent first
**Response `200`:** `PageResponse<AiGenerationJobResponse>`.

---

## 16. CORS

Allowed origins are explicit (never `*`), configured via `APP_CORS_ALLOWED_ORIGINS`
(local default: `http://localhost:3000,http://localhost:5173`). If your frontend runs on a different
origin/port, it must be added to that env var server-side or all cross-origin calls will be blocked
by the browser regardless of a valid token.

- Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- Allowed request headers: `Authorization, Content-Type, Accept`
- Exposed response headers: `Authorization`
- Credentials: allowed (`Access-Control-Allow-Credentials: true`)
- Preflight cache: 3600s

---

## Quick integration checklist for Codex

1. Store `accessToken` + `refreshToken` after login/register+verify; attach
   `Authorization: Bearer <accessToken>` to every call except the public paths in §1.2.
2. On `401`, attempt one silent `POST /auth/refresh`; on failure, force re-login.
3. Decode the JWT (or call `/auth/me`) to know which role-gated UI sections to show — but always
   handle `403`/`404` gracefully on the actual API calls, since UI-level role checks are cosmetic
   only (§1.6).
4. Treat every list endpoint as paginated — never assume a single page has all results.
5. Handle `409` on `GET /sessions/{id}/result` as "not ready yet" (poll/retry), not as a hard error.
6. Surface `ErrorResponse.code` for logic branching and `message`/`fieldErrors` for user-facing text.
