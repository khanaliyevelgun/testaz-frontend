# CLAUDE.md — testaz (Frontend repo, `eduall/`)

> **Project entry point + frontend single source of truth.** Any Claude instance working on the
> frontend should read this file first. §0 gives the whole-project picture (product, architecture,
> backend, database, progress) so a brand-new session understands the system without prior
> conversation; §1–§11 are the detailed **frontend** reference (routing, auth, state, API layer,
> i18n, shared components, conventions); §12 is the change log; §13–§18 are the handoff sections; §19 is the
> **git workflow** (branch → verify → commit → push → merge → push).
>
> **The authoritative BACKEND document is `testaz-backend/CLAUDE.md`** (~3600 lines, the backend
> SSOT). §0 here summarizes it and points to it; do not duplicate backend depth into this file.
>
> **New session? Start with §17 (Next Session).** Then read §0 (project overview), then the
> frontend detail (§1–§11). Handoff sections: §13 this-session summary (incl. repo-cleanliness
> result), §14 remaining issues, §15 future improvements, §16 the intentionally-unimplemented
> backend APIs that must NOT be deleted, §17 next-session starting instructions, §18 the next task,
> **§19 the MANDATORY git workflow** (mirrors the backend's §24 — the "per §24" notes in §12 mean §19 here).
>
> Keep this file in sync when you change architecture, folder structure, state management, the API
> layer, the i18n system, or shared conventions (doc-sync: update the change log §12 + the
> relevant section, then summarize in chat).

---

## 0. Project Overview (whole-system snapshot)

### 0.1 Product
**testaz** — a production test/quiz platform for **Azerbaijani 11th-grade students** preparing for
the **Buraxılış** (graduation) and **Qəbul** (university-entrance) exams. Real product, real launch.

- **Vision / problem→solution:** Parents pay tutors/courses but cannot verify their child is
  actually learning. Students take tests and get a result page with per-question answers + weak
  subject/topic analysis; parents optionally link to a child (with the child's consent) and see the
  same breakdown + notifications; courses/tutors/schools test groups of students via a join code and
  read a results dashboard. **AI (Claude) generates the question bank.**
- **Business model:** **Parents pay; children never do.** A subscription entitlement gate meters
  non-subscribers (free tier → 402) — a student is entitled by their own live subscription OR an
  ACTIVE-linked parent's child-covering plan. Currency AZN.
- **Target users:** 11th-grade students; their parents; and organizations (courses, private tutors,
  schools). **Launch is az-sector only** (UI + content Azerbaijani; the schema/i18n are ready for
  ru/en later).
- **Supported roles** (backend `RoleCode` → UI role): `STUDENT`→`child`, `PARENT`→`parent`,
  `ADMIN`→`admin`, and `COURSE`/`PRIVATE_TUTOR`/`SCHOOL_TEACHER`→ grouped as `organization`. A user
  can hold several roles (e.g. STUDENT+PARENT). See frontend §7 for how roles drive routing/UI.
- **Test categories:** single-subject practice, official exam simulations (Buraxılış = 85 q / 300
  pts / no negative marking; Qəbul = 90 q / 400 pts / per-subject negative marking, 4 wrong cancel
  1 correct on closed questions), and custom mixes. Question types: SINGLE_CHOICE, MULTIPLE_CHOICE,
  SHORT_TEXT. (Full exam blueprints + scoring rules: backend CLAUDE.md §9.)
- **Non-functional requirements:** stateless JWT (RS256) API behind a separate Next.js frontend;
  every list endpoint paginated; no N+1; async scoring + notifications; graceful degradation when
  Claude/payment providers are down (never a raw 500); structured logging with **zero PII** (UUIDs
  only); secrets from ENV.
- **Roadmap:** the backend MVP + a large deferred-feature run are **complete**; the only remaining
  backend item is wiring **real Email/SMS + payment vendors** behind ready seams (vendor-blocked).
  Frontend has UI for the implemented flows; several backend endpoints await frontend integration
  (§16).

### 0.2 Architecture (overall)
Two repos, one product:
- **Backend** (`testaz-backend/`) — a **modular-monolith** Spring Boot 3.5 / Java 21 REST API under
  `az.testifyaz.backend`, Postgres + Redis, JWT (RS256) auth. **Stateless**; the frontend is a
  separate client. Authoritative doc: `testaz-backend/CLAUDE.md`.
- **Frontend** (`eduall/`, THIS repo) — a **Next.js 14 App Router** app (plain JS/JSX, no
  TypeScript), Bootstrap 5 + SCSS on a purchased "EduAll/DP_Market" template, custom runtime i18n.
  Talks to the backend only through `src/lib/api.js`. Detailed in §1–§11.
- **Contract:** the backend wraps responses as `{ data, message }` and paginates as Spring `Page`
  (`content`/`page`/`size`/`totalElements`/`totalPages`); the frontend normalizes this at the
  boundary (§5). OpenAPI at the backend origin `/swagger-ui/index.html`; local copy `openapi.yaml`.

### 0.3 Backend (summary — see `testaz-backend/CLAUDE.md` for depth)
- **Status:** MVP build (steps 1–15) + a large hardening/deferred-feature run **complete & verified**
  — builds, boots, passes **130 integration tests** on real Postgres + Redis (Testcontainers).
- **Modules (17 domain + `seed`):** `common`, `auth`, `user`, `student`, `parent`, `organization`,
  `subject`, `question`, `test`, `result`, `notification`, `ai`, `subscription`, `payment`, `report`,
  `audit`, `admin` (thin orchestration), `seed` (dev-only). Rules: module isolation (call only via
  public service interfaces, never another module's repo/entity — ArchUnit-enforced), controller →
  service → repository layering, DTOs only at the boundary (MapStruct), SOLID/interfaces.
- **Security:** BCrypt(12); JWT RS256 (access 15 min, refresh 7 days, rotation + reuse detection);
  two `SecurityFilterChain`s (a stricter `/api/v1/admin/**` chain); Redis token blacklist on logout;
  Bucket4j rate limiting; **authorization in depth** — `@PreAuthorize` + service-layer ownership +
  **query-level enforcement for child data** (a non-linked parent's query returns nothing); OTP
  attempt cap; append-only `audit_log`; zero-PII logging.
- **Key patterns:** async scoring (AFTER_COMMIT `@Async`); transactional-outbox notifications;
  DB-first question serving with AI fallback on exhaustion; provider-agnostic seams for Email/SMS
  (`EmailSender`/`SmsSender`, `Logging*` fallbacks) and payment (`PaymentProvider`,
  `MockPaymentProvider`) — real vendors drop in via `@ConditionalOnMissingBean` (vendor-blocked, so
  not yet wired). Batch id→name enrichment (`UserService.findBasicInfoByIds`) for list DTOs (no N+1).
- **API organization:** base `/api/v1`; public (auth, taxonomy, exam-defs, plans, media, webhook);
  authenticated (sessions, results, students/parents, exams, notifications, subscriptions,
  payments); admin `/api/v1/admin/**` (users, subjects, topics, questions, AI, reports, audit,
  subscriptions, payments, plans, dashboard). Full list: backend §18.
- **External integrations:** Anthropic Claude (`/v1/messages`, Resilience4j-guarded) for question
  generation; Email/SMS + payment (Payriff planned) behind swappable seams.

### 0.4 Database (summary — see backend CLAUDE.md §5/§17 for the full schema)
- **Postgres**, schema owned by **Liquibase** only (`ddl-auto=validate`, never create/update);
  **34 migrations (0001–0034)**, master changelog `db/changelog/db.changelog-master.yaml`.
- **Conventions:** UUID v7 PKs for externally-exposed tables (no enumeration of children's data);
  SMALLINT + unique `code` for small reference tables (grades, subjects, roles, plans); `TIMESTAMPTZ`
  everywhere with `created_at`/`updated_at`/`version`; **every FK indexed**, composite indexes on hot
  selection paths; enum columns persist as `@Enumerated(STRING)` VARCHAR **with a CHECK constraint**
  (a bad enum value would otherwise 500 on the next read — schema-wide since migration 0027);
  historical tables (`result_details`, `weak_areas`) store subject/topic/question ids as **snapshot
  values (no FK)** so editing a question later never alters a past result; `students.id = users.id`
  (shared PK — a profile IS a user).
- **Important tables:** `users`/`roles`/`user_roles`; `refresh_tokens`/`one_time_tokens`;
  `subjects`/`topics`/`grades` + `exam_definitions`/`exam_groups`/`exam_group_subjects`;
  `questions`/`question_options`/`accepted_answers`; `tests`/`test_sections`/`test_questions`/
  `test_assignments`/`exam_templates`; `test_sessions`/`…answers`/`results`/`result_details`/
  `weak_areas`/`student_subject_stats`/`student_topic_stats`; `parents`/`parent_student_links`/
  `parent_link_invitations`; `organizations`/`organization_members`/`test_invites`;
  `notifications`/`notification_outbox`/`…preferences`/`…templates`; `subscription_plans`/
  `subscriptions`/`subscription_usage`; `payments`/`payment_webhook_events`; `question_reports`;
  `audit_log`; `ai_generation_jobs`/`ai_raw_responses`.
- **Local dev data:** a `@Profile("seed")` `DevDataSeeder` fills the Docker Postgres with realistic
  interconnected data through the service layer (real BCrypt users, webhook-activated subscriptions,
  generated audit history). Seeded logins: admin `admin@testaz.local` / `Admin!2345`; everyone else
  `<generated-email>` / `Parol!2345`. Regenerate: backend CLAUDE.md §27.

### 0.5 Development Progress

> **HANDOFF STATE (2026-07-30):** Frontend + backend are at **full feature parity — the last API gap is CLOSED.**
> Every backend capability that should be user-accessible is implemented and wired, for all four roles, including
> the previously-deferred **admin manual subscription grant/modify** UI (shipped 2026-07-30 — see §12). There is
> now **no known backend endpoint without frontend integration**. Production build green; i18n audit green (189
> source files, 3526 locale entries). Repo on `main`, **pushed to `origin` =
> `github.com/khanaliyevelgun/testaz-frontend`**. A **full frontend engineering review (2026-07-30)** removed 5 dead
> routes (66 → **61**), fixed the untranslated topic-management UI, and corrected a dangerous doc error
> (`/admin/courses/**` is LIVE — see §11 ⚠️). Remaining work is optional polish (§14: dynamic server-message i18n,
> no automated test suite) plus the **backend-blocked** real Email/SMS + payment vendors. See §14 for the remaining
> issue list and §18 for the next task.
>
> *(Earlier handoff, 2026-07-25: parity reached except the then-deferred admin-subscription UI; a full
> Backend↔Frontend parity audit + a feature-completeness audit were completed.)*

- **✅ Completed (backend):** all 17 modules; the full MVP build order (auth → taxonomy → question
  bank → AI generation → test-taking + scoring → student/parent linking → organizations →
  notifications → reports → subscriptions/payments → audit → admin → exam management) PLUS the
  deferred-feature run (trends rollups, subscription lifecycle + plan CRUD, retention jobs, AI
  runtime replenishment, org digest, exam owner lifecycle + retakes, security hardening, dev-data
  seeder). **131 tests green** (the frontend official-exams work surfaced + fixed one backend Redis-cache
  serialization bug on `/exam-definitions` — see §12). Backend is the authoritative SSOT: `testaz-backend/CLAUDE.md`.
- **✅ Completed (frontend):** auth (sign-in/up, forgot/reset, refresh); role dashboards
  (admin/parent/child/organization); **student self-start practice** (`/admin/practice`), **official exam
  simulations** (`/admin/official-exams`), **org-invite redemption** (`/admin/join`); student results (list +
  paginated detail) + question reporting; exam-taking by share code (preview → start → answer/autosave → submit →
  scored result) + **exam owner lifecycle** (archive/delete/regenerate-share-token/assignments); parent
  dashboard/children/progress/notifications + invitation flow; organization management/members/invites/results;
  full admin panel (users, subjects, topics, questions + AI generation, reports, audit, subscriptions [read],
  payments, plans, dashboard); **self-service profile edit** (`/admin/profile` → `PUT /users/me`);
  subscriptions/entitlement/checkout (mock) + **payment-return landing** (`/payment/return`); i18n (az/en) with
  key-based + runtime static + params-based helpers; loading skeletons (table + card), empty states,
  accessibility in shared primitives. Production build green (**65 routes**).
- **🔶 Recent sessions (2026-07-23; all in the change log §12):** a **remaining-issues fix pass** (payment
  checkout 404 → new return page; one-shot-exam "already completed" UX; refresh-token cross-tab guard), then a
  **5-batch UX/accessibility polish pass** that preserved the existing identity (no redesign): (1) localized
  ~126 English error/feedback strings + (5) 26 placeholders to AZ (+ EN fallback in `i18n.js`
  `staticFallbackTranslations`); (2) loading **skeletons** (`AdminTableSkeleton`, 19 tables); (3) **empty states**
  (`AdminEmptyState`, 18 tables); (4) **accessibility** in shared primitives (pagination live-region/labels,
  keyboard-operable row-action menu, `:focus-visible` rings, aria-labels). No in-flight partial work.
- **✅ Ad-hoc practice-session start (2026-07-24):** students self-start a practice test at
  `/admin/practice` (subject + difficulty + optional topic + count → `startSession`), reusing the
  existing session runner + Results page. Change log §12.
- **✅ Org-invite redemption (2026-07-24):** students join a course/tutor/school test by code at
  `/admin/join` (`redeemOrganizationInvite` → join + start/resume → the session runner; also linked
  from Assignments). Change log §12.
- **✅ Official exam simulations (2026-07-24):** students browse the Buraxılış/Qəbul blueprints, pick a
  Qəbul group, and start the real timed simulation at `/admin/official-exams` (`fetchExamDefinitions` +
  `fetchExamDefinition` + `startSession(OFFICIAL_EXAM)` behind a confirm dialog → the session runner).
  Change log §12. *(This also fixed a backend Redis-cache-serialization bug on `/exam-definitions` — see
  the change log; backend now 131 tests.)*
- **✅ Exam share-token regeneration (2026-07-24):** the exam owner rotates a leaked share code via a
  "Regenerate code" button on the exam detail page (`regenerateExamShareToken` → old link 404s, displayed
  link updates). **This was the last §16 item — the intentionally-unimplemented backend-API list is now
  EXHAUSTED (§16).** Change log §12.
- **✅ Self-service profile edit (2026-07-24):** any user edits their own name/email/phone via a "Basic
  information" form on `AccountProfilePage` (`PUT /users/me`), with Verified/Not-verified badges and a
  re-verification note. Closed the parity-audit 🟡 gap. Change log §12.
- **✅ Live-testing bug batch (2026-07-25):** 5 issues found by the user click-testing the running app —
  fixed 4, and one ("official exam shows no questions") was investigated and confirmed **not a bug** (the API
  returns 85 populated questions; the runner renders them). Notable root cause: the `AdminSearchSelect`
  subject/topic selection didn't persist because the runtime i18n `MutationObserver` reverted the trigger's
  text node to its first-seen (placeholder) value — fixed with `data-i18n-managed` + `tx(placeholder)`. Also:
  home register CTAs → `/sign-up` (were 404), filter-caret padding, a profile English string. Change log §12.
- **✅ Repo published (2026-07-25):** frontend pushed to `origin = github.com/khanaliyevelgun/testaz-frontend`
  (`main`, full history). No secrets tracked (`.env` holds only the public `NEXT_PUBLIC_API_BASE_URL`).
- **✅ Admin manual subscription control (2026-07-30):** an admin grants a comped subscription
  (`POST /admin/subscriptions`) and modifies one (`PUT /admin/subscriptions/{id}` — plan/status/expiry) from
  `AdminSubscriptionsPage`, which also now shows the payer's name + email instead of a raw UUID. **This was the
  last backend-API frontend gap — none remain.** Change log §12.
- **⛔ Not yet implemented (frontend):** nothing — no known backend endpoint lacks frontend integration.
  **Backend-blocked:** real Email/SMS + payment providers (vendor accounts needed) — a backend concern, no
  frontend UI to build until the providers exist.

---

## 1. What this is (frontend specifics)

The web client for **testaz** (product overview in §0). It talks to the Spring Boot backend
documented in `openapi.yaml` / `docs/API_DOCUMENTATION.md`.

- **Framework:** Next.js **14.1.4** (App Router), React 18, **plain JavaScript (JSX, no TypeScript)**.
- **Styling:** Bootstrap 5 + SCSS (`app/globals.scss`), a purchased "EduAll / DP_Market"
  template. Class names are template utility classes (`text-neutral-500`, `rounded-pill`,
  `common-input`, `btn-main`, …). Icons are **Phosphor** (`ph ph-*`, `ph-bold ph-*`).
- **Languages:** Azerbaijani (default) + English, via a custom runtime i18n layer (§6).
- **Roles:** `admin`, `parent`, `child` (= backend `STUDENT`), and the organization
  roles `course` / `private_tutor` / `school_teacher` (grouped as `organization`).

The app is **template-derived**: the public marketing pages (`/`, `/about`, `/blog`,
`/contact`, `/faq`, `/pricing-plan`) still use the original template components in
`src/components/*.jsx`. The actual product lives under `/admin/**` and the
auth/exam flows.

---

## 2. Commands

```bash
npm run dev            # dev server on :3000
npm run build          # production build — MUST stay green (61 routes since 2026-07-30)
npm run start          # serve the production build
npm run lint           # next lint
```

i18n / template tooling (see `scripts/`):

```bash
npm run i18n:extract          # extract static template strings
npm run i18n:audit            # audit i18n coverage
npm run template:archive      # move unused template files to backup/legacy-template
```

**Backend origin** comes from `.env`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://192.168.100.39:8080   # empty ⇒ same-origin
NEXT_PUBLIC_MAX_GRADE=11                               # highest grade in admin selectors
```

The app expects a reachable backend for all auth and data requests.

---

## 3. Folder structure (`src/`)

```
app/                     App Router. Route files are THIN wrappers (§4).
  layout.jsx             Root layout: providers (Bootstrap, icons, Locale, Auth).
  admin/                 The dashboard. layout.jsx → AdminLayout; each page.jsx
                         delegates to a components/admin/*Page.jsx component.
  exam/[code]/           Public exam-take entry (by share code).
  exam-session/[id]/     Public exam-session runner.
  sessions/[id]/result/  Result page.
  payment/return/        Payment provider return landing (reads ?ref/?status;
                         verifying → active/pending/failed; polls subscriptions).
  sign-in / sign-up / forgot-password / new-password / reset-password
  about / blog / contact / faq / pricing-plan   Template marketing pages.
  api/openapi/route.js   Serves the local openapi.yaml.

components/
  *.jsx                  Template + shared leaf components (Header, Footer, auth
                         inner forms, PaymentReturnInner, StaticText/StaticOption,
                         LocaleProvider, …).
  admin/                 ALL dashboard feature components (*Page.jsx) + admin
                         primitives (AdminPagination, AdminStatusBadge,
                         AdminTableSkeleton [loading rows], AdminEmptyState, …).
  admin/sidebar/         Role sidebars (admin/parent/child/organization) + RoleSidebar
                         shell + sidebarItems.js (the nav definitions).
  auth/                  RoleProtectedRoute, PublicOnlyRoute (client-side route guards).

lib/
  api.js                 THE API layer — every backend call + response normalization (§5).
  authRoles.js           Role vocabulary, normalizeRole, route→role map (used by middleware).
  i18n.js                Translation engine (dictionaries, key lookup, API-message localization).
  questionContent.js     Question rendering helpers.

hooks/useAuth.js         Auth actions (login/register/logout/refresh) over the store.
stores/authStore.js      In-memory auth store + AuthProvider (useSyncExternalStore).
helper/                  Template bootstrap helpers (BootstrapInit, LoadPhosphorIcons,
                         RouteScrollToTop, Animation).
locales/                 az.json, en.json + locales/static/* (extracted template strings).
middleware.js            Server-side /admin/** guard: validates the token with the backend.

backup/legacy-template/  Archived, UNUSED original template pages. Not imported anywhere;
                         created/managed by scripts/archive-unused-template.mjs. Leave it be.
```

---

## 4. App Router ↔ component pattern (CONVENTION — keep it)

Route files under `app/` are **thin wrappers**. They import a feature component and
render it (optionally wrapped in a route guard). All logic, state, and markup live in
the component, almost always under `components/admin/`.

```jsx
// app/admin/users/page.jsx
import AdminUsersPage from "@/components/admin/AdminUsersPage";
export default function Page() { return <AdminUsersPage />; }
```

```jsx
// app/admin/exams/page.jsx  (guarded example)
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import AdminExamsPage from "@/components/admin/AdminExamsPage";
export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "parent"]}>
      <AdminExamsPage />
    </RoleProtectedRoute>
  );
}
```

Why: keeps route files trivial, keeps feature components independently testable/movable,
and lets the same component be reused (e.g. exam-take by different base paths).

**When adding a page:** create `app/<route>/page.jsx` (thin) + `components/admin/<Name>Page.jsx`
(the real thing). Add the nav entry to `sidebar/sidebarItems.js` and, if role-restricted,
the route→role rule in `lib/authRoles.js` (`routeRoles`) so `middleware.js` enforces it.

---

## 5. API layer (`src/lib/api.js`)

**All** backend communication goes through this one module. Do not `fetch` the backend
from components — add/extend a function here instead.

- `apiFetch(path, options)` is the core. It prefixes `/api/v1`, attaches
  `Authorization: Bearer <accessToken>` for non-auth endpoints, sets JSON headers,
  and on a `401` transparently runs a **single shared refresh** and retries once
  (concurrent 401s queue behind the same refresh promise). On refresh failure it
  clears auth state and redirects to `/sign-in`.
- **Response shape normalization.** The backend wraps payloads as `{ data, message }`
  and paginates as Spring `Page` (`content`, `totalElements`, `page`, `size`, …).
  Helpers normalize this at the boundary so components see a stable shape:
  - `unwrapApiResponse(res)` → the `data` field.
  - `normalizePage(res, page, perPage)` → `{ data: [], meta: { page, perPage, total, totalPages, hasNext } }`.
    **`meta.page` is 1-based** in the UI; requests convert to the backend's 0-based `page`.
  - Per-domain `normalize*` mappers (`normalizeUser`, `normalizeSession`,
    `normalizeSubscriptionPlan`, …) add derived/defaulted fields.
- `normalizeRole` is imported from `lib/authRoles.js` (single definition — do not
  re-define it here). Backend `STUDENT` maps to UI `child`.
- Every exported function is a small named async wrapper (`fetchUsers`, `createExam`,
  `startSession`, …). Follow that style for new endpoints: build the query with
  `toQueryString`, call `apiFetch`, then `unwrapApiResponse` / `normalizePage`.
- `ApiError` (exported) carries `{ status, data }`; catch it in components for
  status-aware handling. User-facing messages are already localized (§6).

This file is long (~1000 lines) but intentionally flat and uniform. If it ever needs
splitting, split by domain (`api/auth.js`, `api/exams.js`, …) behind the same names —
do not change call sites' import shape casually.

---

## 6. i18n — READ THIS BEFORE CHANGING ANY UI TEXT ⚠️

The app supports **az** (default) and **en**. There are two translation mechanisms,
and one of them constrains how you edit JSX.

### 6a. Key-based translation (new/preferred)
`useTranslation()` from `components/LocaleProvider` gives `t(key, params)` — looks up
`locales/az.json` / `en.json` by dotted key. Use this for new strings where practical.

### 6b. Static-text translation (template legacy) — the important one
Most visible strings in this codebase are **hard-coded literals** wrapped in
`<StaticText text={"..."} />` / `<StaticOption text={"..."} />`, or plain template text.
`LocaleProvider` translates these at **runtime by matching the exact string** against a
translation map (`getStaticTextTranslations`), using a `MutationObserver` + `TreeWalker`
over the DOM plus a lookup keyed on the source string.

**Consequences you must respect:**
- **The exact literal string is the translation key.** If you change a `StaticText`
  literal (even whitespace/punctuation), its az/en translation silently stops resolving
  and it renders in the source language. **Do NOT reword, re-case, or reformat visible
  text during refactors.** Copy changes are a separate, deliberate task.
- Passing a variable to `StaticText` (`<StaticText text={someString} />`) is fine **as
  long as the string value is still one of the known literals**. Shared components
  (e.g. `AdminPagination`) therefore render `<StaticText text={"Previous"} />` with the
  literal inline, not a prop, so the key is preserved.
- `data-i18n-managed='true'` (set by `StaticText`) tells the observer "hands off — this
  subtree manages its own text." Keep that wrapper; it prevents double-translation.
- New static source strings must be added to the extraction/translation pipeline
  (`scripts/i18n:extract` → `locales/static/*`) or they won't have an en translation.

### 6b-bis. Adding a translated string WITHOUT the extraction pipeline ⭐ (the practical path)
The extraction pipeline keys translations by a computed hash, so hand-adding an entry means
reproducing that hash. The simpler, hash-free path — used throughout the 2026-07-23 polish
work — is **`staticFallbackTranslations`** in `lib/i18n.js`: a flat `{ az: {...}, en: {...} }`
map keyed **directly by the AZ source string** → its translation. `getStaticTextTranslations`
folds these in (and now also folds in fallback entries whose source string isn't in the
extracted `staticSource` at all — see the function), so an entry here is picked up by BOTH
`tx()` (for `StaticText`) and the DOM observer (for raw `{error}`/`{notice}` text and
translated attributes like `placeholder`/`aria-label`).
- **Convention for a new user-facing string:** write the literal in **Azerbaijani** (the
  source/default locale — it renders correctly in AZ with no entry), then add
  `"<az source>": "<english>"` to `staticFallbackTranslations.en`. That covers both directions.
- This is how error/feedback messages (`setError("…AZ…")` rendered as raw `{error}`),
  placeholders, and new aria-labels are localized — none go through the hash pipeline.
- **Cannot be translated this way** (not in the DOM at toggle time): `window.confirm()` /
  `window.alert()` dialog strings (write them in AZ — correct for the launch audience) and
  **dynamic template-literal strings** (`` `${n} added.` ``) — those need a params-based
  helper and are deliberately left English for now (flagged in §14/§15).
- **Note on files:** `lib/i18n.js` is **CRLF** — a scripted multi-line insert must match
  `marker + "\r\n"`, or `String.replace` silently no-ops (a bug hit + fixed during this work).

### 6c. API message localization
`apiFetch` runs backend `message`/`error`/`detail`/`title` fields through
`localizeApiResponse` / `translateApiMessage` (`lib/i18n.js`), which map backend message
keys/codes to localized copy (with sensible fallbacks like `api.forbidden`). Components
can display `error.message` directly — it's already localized. **User content (names,
emails, free text) is never translated.**

---

## 7. Auth & authorization

Three layers cooperate; see `README.md` "Auth Flow" and `docs/auth-usage.md` for the
backend contract.

- **In-memory store** (`stores/authStore.js`): `accessToken` + `user` live in memory
  via `useSyncExternalStore`. The `refreshToken` is mirrored to `localStorage` + a
  same-origin cookie; the `accessToken` is mirrored to a cookie **only so `middleware.js`
  can read it** — cookies never grant access by themselves.
- **`AuthProvider`** (in `authStore.js`, mounted in the root layout): on startup it
  attempts `/auth/refresh` → `/auth/me` to hydrate the user; failures fall back to the
  valid unauthenticated state.
- **`useAuth()`** (`hooks/useAuth.js`): exposes `login`, `register`, `logout`, `refresh`,
  `loadProfile`, plus the current snapshot and `redirectToLogin`.
- **Client route guards** (`components/auth/`): `RoleProtectedRoute` (wrap protected
  pages/sections; checks `hasAllowedRole`) and `PublicOnlyRoute` (bounce authed users
  off `/sign-in` etc.). These are **cosmetic UX guards**.
- **Real enforcement is server-side**: `middleware.js` runs on `/admin/:path*`, validates
  the token against the backend (`GET /auth/me`, with a refresh attempt), and redirects
  based on `getAllowedRolesForPath` (`lib/authRoles.js`). Changing client role state does
  not grant access.

**Role vocabulary lives in `lib/authRoles.js`** (`ORGANIZATION_ROLES`, `ADMIN_ROLES`,
`normalizeRole`, `getUserRoles`, `getPrimaryRole`, `hasAllowedRole`, `routeRoles`).
`middleware.js` and the client guards both consume it — keep it the single source.

**Refresh-token double-rotation — cross-tab guard (IMPLEMENTED 2026-07-23).** Mechanism (confirmed
against the live backend): `apiFetch`'s single shared `refreshPromise` (§5) dedupes concurrent
refreshes **within one tab**, but not across tabs. Two tabs both hitting a 401 near-simultaneously
each POST `/auth/refresh` with the same pre-rotation refresh token; the backend rotates on the first
and flags the second as **"Refresh token reuse detected"** (401) → revokes the whole token family →
both tabs get logged out on their next request. It was only ever triggered by manual out-of-band
`/auth/refresh` calls during debugging, never through normal app usage.

**The guard** (`stores/authStore.js` + `lib/api.js`), additive and behaviour-preserving:
- `setAuthState` mirrors the access token to a `localStorage` signal key (`eduall.accessToken`);
  writing it fires a `storage` event in **other** tabs.
- `AuthProvider` listens for that `storage` event and **adopts** a sibling's freshly-rotated access
  token into memory (`adoptAccessTokenFromOtherTab`) instead of running its own refresh — so a
  staggered second tab never races. It also mirrors a cross-tab logout (a `refreshToken` removal in
  one tab clears auth in the others).
- `refreshAccessToken` **recovers** from a lost race: if its refresh fails but the shared signal now
  holds a **different** access token (a sibling rotated during our attempt), it adopts that token
  instead of calling `clearAuthState()` — turning a "reuse detected" logout into a silent recovery.

**Limitation:** the truly-simultaneous same-tick race (both tabs POST before either writes the signal)
is *narrowed*, not eliminated — deliberately **no cross-tab lock** was added (a stale/held lock after
a tab crash is a worse failure mode than a rare logout). Still **not reproduced through normal usage**.
If "random logouts" are ever reported, check whether they correlate with multiple open tabs, and look
in the backend's `refresh_tokens` table for a family with many rows all `revoked_at` set close together
(the reuse-detection signature) around the report time.

---

## 8. Admin dashboard conventions

- **Layout:** `app/admin/layout.jsx` → `AdminLayout` wraps everything in
  `RoleProtectedRoute` and renders a **role-specific sidebar** (`sidebarByRole` keyed by
  `getPrimaryRole(user)`) + `AdminHeader` + `AdminFooter`. All four sidebars share the
  `RoleSidebar` shell and differ only by their `sidebarItems.js` array.
- **List pages** follow a recurring shape: local `useState` for `data` + `meta` +
  `isLoading` + `error` + filters, a `loadX` async loader, a filter/search effect, a
  table, and a pager. Shared, provably-identical pieces are extracted:
  - **`AdminPagination`** (`components/admin/AdminPagination.jsx`) — the standard pager
    footer. Props: `meta` + `onPageChange(nextPage)` (already-clamped page). Use it for
    any new list page with the standard footer.
  - **`AdminStatusBadge`**, **`AdminRowActions`** (kebab dropdown — keyboard-operable: Esc
    closes + returns focus, `role="menu"`), **`AdminRefreshButton`**, **`AdminSearchSelect`**,
    **`AdminGradeSelect`**, **`AdminRichTextEditor`** — reuse these.
  - **`AdminTableSkeleton`** (`columns` + optional `rows`) — the loading placeholder for a list
    table; renders shimmer rows matching the column count (shimmer in `globals.scss`,
    prefers-reduced-motion aware). Use it in the `isLoading` branch of a table `<tbody>`.
  - **`AdminCardSkeleton`** (`rows` + optional `columns` [1 stacked / 2 two-up]) — the loading placeholder
    for a single-record **detail/form card** (the non-table sibling; each row is a short label line above a
    taller `.skeleton-input` line). Same shimmer + `role="status"` a11y. Use it in the `isLoading` branch of a
    detail/form card instead of a plain `<p>Loading…</p>`.
  - **`AdminEmptyState`** (`columns`, `icon`, optional `action={{href,label}}`, message as
    children) — the empty-table placeholder (muted Phosphor icon + message + optional action
    link, wired ONLY where a navigable create action already exists). Use it in the no-rows branch.
  - `AdminPlaceholderPage` — for not-yet-built sections.
- **Known remaining duplication (intentionally left):**
  - The page **header block** (`h4` title + `p` subtitle + right-aligned actions) repeats
    across ~25 pages, but the wrapper class (`align-items-center` vs `-start`), the
    subtitle (string vs interpolated JSX), and the actions vary per page — too heterogeneous
    to extract without risking output changes. Left inline by design.
  - **5 list pages** (`AdminPayments…`, `AdminSubscriptions`, `AdminSubscriptionPlans`,
    `OrganizationMembers`, `ParentProgress`) use a **different pager** (`disabled={isLoading || …}`,
    `Math.max(totalPages,1)`, multi-arg loaders). They deliberately keep their own footer
    rather than being forced into `AdminPagination`, to preserve exact behavior.
  - The list-page **state machine** (load/loading/error/meta + debounce) is similar but not
    identical across pages (some debounce search, some don't; loader signatures differ). A
    shared `useAdminList` hook is a reasonable future step **only if** it can preserve each
    page's exact behavior — do not homogenize debounce/reload timing.

---

## 9. Hard rules (do not break)

1. **Do not change visible copy, layout, colors, or DOM structure during refactors.**
   Because of the runtime string-matching i18n (§6b), even trivial text edits break
   translations. Copy/design changes are separate, deliberate passes.
2. **All backend calls go through `lib/api.js`.** No ad-hoc `fetch` in components.
3. **Route files stay thin** (§4); logic lives in feature components.
4. **Role vocabulary lives in `lib/authRoles.js`** — one definition, consumed by both
   middleware and client guards. Never re-declare `normalizeRole` elsewhere.
5. **Client role checks are cosmetic**; never rely on them for security. `middleware.js`
   + the backend are the enforcement.
6. **`meta.page` is 1-based in the UI, 0-based to the backend.** Convert only in `api.js`.
7. **Keep the production build green** (`npm run build`, **61 routes** since the 2026-07-30 dead-route
   cleanup). Verify after any change.
8. Prefer reusing the admin primitives (§8) over re-implementing pagers/badges/dropdowns.

---

## 10. Verifying "nothing changed" after a refactor

The app has **no automated test suite**, so verification is manual:

1. `npm run build` must be green with the **same 61 routes** as before
   (compare the route table; static vs dynamic markers unchanged).
2. Run `npm run dev` and walk the major flows: sign-in → dashboard per role; a student
   taking an exam (`/exam/[code]` → session → result); the parent dashboard
   (children/progress); the admin panel (users/questions/exams/subjects list+CRUD,
   pagination, filters); subscription/payment screens.
3. Confirm both locales still render (toggle via the language switcher) — a broken
   `StaticText` literal shows the source-language string.

---

## 11. Gotchas / notes

- **⚠️ `/admin/courses/**` is LIVE — never delete it (verified 2026-07-30).** The name is a template
  leftover, and older notes in this file wrongly called it a "dead scaffolding route… safe to remove."
  **It is the ONLY route to topic management.** `AdminSubjectsPage`'s per-row action **"Mövzular"
  (Topics)** links to `/admin/courses/{subjectId}/topics`, and `AdminTopicsPage` /
  `AdminTopicFormPage` are reachable from **nowhere else** (`grep` proves 0 other route references).
  Deleting these routes silently destroys admin topic CRUD — an entire backend surface
  (`/admin/topics` × 5 endpoints) would become unusable from the UI. `/admin/courses` and
  `/admin/courses/[id]/edit` *are* thin aliases of the Subjects pages, but the `topics` subtree is
  not. If the naming is ever cleaned up, **move** the topic routes to `/admin/subjects/[id]/topics`
  and update the 5 link sites (`AdminSubjectsPage`, `AdminTopicsPage` ×2, `AdminTopicFormPage` ×2) —
  do not just delete.
- **No TypeScript.** `jsconfig.json` only sets the `@/*` → `src/*` path alias.
- **`reactStrictMode: false`** (`next.config.js`) — effects run once in dev.
- Template globals: **jQuery / Bootstrap JS / Phosphor / AOS / WOW** are loaded via
  `helper/*` in the root layout. Some template components assume these exist on `window`.
- `backup/legacy-template/` is a deliberate, tool-managed archive of unused template
  pages — not imported anywhere. Don't wire it back in; don't treat it as live code.
- The public exam-take component (`ExamTakePage`) is reused with different
  `sessionBasePath` for the public (`/exam-session`) and admin (`/admin/exam-session`) flows.
- When in doubt about the backend contract, consult `openapi.yaml` /
  `docs/API_DOCUMENTATION.md`; the remote Swagger UI is at the backend origin
  `/swagger-ui/index.html`.

---

## 12. Change log (keep append-only; newest first)

- **Full frontend engineering review (2026-07-30, Phase 2 of a 3-phase audit).** A complete production-readiness
  review of all 171 source files: architecture, dead code, React correctness, hooks/effects, memory leaks, state,
  API integration, error handling, a11y, security/XSS, bundle, routing, localization. **Two real defects found and
  fixed; one dangerous piece of documentation corrected.** Build green (**66 → 61 routes**, only dead ones removed),
  i18n audit green (183 files, 3526 entries), zero console errors. Branch `fix/frontend-review-2026-07-30`.
  - **🔴 Doc correction (the most important finding) — `/admin/courses/**` is LIVE, not dead.** §14/§18 previously
    listed it among "6 dead scaffolding routes… safe to delete," claiming it only re-maps components reachable via
    `/admin/subjects`. **That was wrong.** `AdminSubjectsPage`'s row action "Topics" links to
    `/admin/courses/{id}/topics`, and `AdminTopicsPage`/`AdminTopicFormPage` are reachable from nowhere else —
    deleting the subtree would have silently destroyed admin topic CRUD (5 backend endpoints orphaned). Verified
    live: the page loads 8 real MATH topics with working create/edit/filter/pagination. A ⚠️ warning is now in §11
    and the §14/§18 entries are corrected. **Lesson: verify a route's reachability by grepping link sites, never by
    its name.**
  - **Fix 1 — untranslated topic-management UI.** Because the page was believed dead, it had **zero** translation
    coverage: "Topics", "Create Topic", "Topic", "Action", "Create", "Save", "Subject ID:", "Name AZ", etc. all
    rendered **English in the AZ-default UI**. Added 15 `az` fallback entries (§6b-bis). Verified live: the page now
    renders "Mövzular" / "Mövzu yarat" with all 5 table headers in Azerbaijani, data loading unchanged.
  - **Fix 2 — deleted 5 genuinely-unreachable placeholder routes** (`/admin/child`, `/admin/parent`,
    `/admin/messages`, `/admin/my-courses`, `/admin/wishlist`) + `AdminPlaceholderPage` + their 5 dead
    `authRoles.js` rules. These shipped **Turkish** template copy ("Mesajlaşma paneli…") in the production bundle.
    Confirmed unreachable (0 link sites) and that `/^\/admin\/child(?:\/|$)/` does not shadow the live
    `/admin/children`. Verified live: all 5 now 404 while `/admin/subjects`, `/admin/courses/1/topics`,
    `/admin/children`, `/admin/questions` still return 200.
  - **Verified clean (actively checked, nothing to fix):** zero unused components (every `.jsx` is imported); **zero
    unused `api.js` exports** (§16 genuinely exhausted); zero timer leaks (`setInterval`/`setTimeout` all paired with
    clears); zero listener leaks (`addEventListener`/`removeEventListener` balanced); 18 components use `isMounted`
    guards. **XSS: the `sanitizeQuestionHtml` allow-list was empirically tested against 11 payloads** (unclosed
    `<script>`, `img onerror`, `javascript:` URI, `svg onload`, nested `<scr<script>ipt>`, `a href=javascript:`) —
    **all neutralized**, while valid `<img src="/media/…">` and plain math (`3 < 5`) pass through; combined with the
    backend's OWASP sanitization on save this is proper defense in depth.
  - **Reviewed and deliberately KEPT:** `setAccessToken` (the only genuinely unreferenced export — a 1-line
    symmetric part of the auth-store API); `key={index}` in `AdminQuestionFormPage`'s option editor (rows are
    append/remove-at-end, no reorder, so no identity bug); `}, [loadX]` effect deps (the loaders are `useCallback`-
    stable); template-page `<img>` a11y gaps (touching them risks the §6b string-match i18n for no functional gain).

- **Docs — added §19 Git Workflow, aligning the frontend with the backend (2026-07-30, user-directed).**
  Documentation-only; no code change. The frontend had **no git section at all** even though the change log
  referenced "per §24" **11 times** (a backend section number), and §13 recorded the opposite policy
  ("commit-only for the assistant — not pushed / not merged"). Both are now resolved:
  - **New §19 Git Workflow (MANDATORY)** mirroring `testaz-backend/CLAUDE.md` §24, so both repos follow ONE
    workflow: branch per change off `main` (`feat/`/`chore/`), never commit to `main` directly, **no Pull
    Requests**; finish flow = commit → **push the branch** → `--no-ff` merge to `main` → **push `main`** →
    delete the branch (local + remote). Conflict handling is the backend's verbatim (resolve automatically,
    preserve functionality, re-verify, commit; stop only for business-logic ambiguity, destructive overwrites,
    persistent gate failures, or permission blocks).
  - **Verification gates are the frontend's, not the backend's** — this repo has no automated test suite (§10),
    so "green" means `npm run build` compiles with the **route set unchanged** + `npm run i18n:audit` passes
    (the backend's gate is `./gradlew build` with its 131 tests).
  - **The "commit-only" rule is explicitly SUPERSEDED.** Work is now committed, merged, and **pushed** without
    waiting for separate approval. §13's note is retained but marked historical.
  - Also fixed two dangling cross-references: the header's section map (said the file ends at §18; the
    "per §24" notes now point at §19) and a "§20-style doc-sync" reference (no §20 exists here — the doc-sync
    instruction is §12 + the relevant section). §17 now names §19 in its starting instructions.

- **Feature — admin manual subscription control (grant + modify) (2026-07-30).** Wired the LAST two backend
  admin-subscription endpoints that had no UI — **the frontend↔backend parity gap is now CLOSED** (§14's only
  remaining API item; §18's named next task). `AdminSubscriptionsPage` was read-only (list + filters); an admin can
  now **grant** a comped/support subscription and **modify** an existing one. No new route — a single-page
  enhancement. Verified end-to-end against the live backend + Postgres (both locales); build compiles clean (route
  set unchanged) + `i18n:audit` green (189 files, 3526 entries). Branch `feat/admin-subscription-control`
  (`--no-ff` merge to `main`, per §24).
  - **api.js:** `grantAdminSubscription(payload)` → `POST /admin/subscriptions`; `updateAdminSubscription(id,
    payload)` → `PUT /admin/subscriptions/{id}`. Existing wrapper style, both reusing `normalizeSubscription`.
  - **Grant modal:** a **searchable user picker** (reuses `AdminSearchSelect` + `fetchUsers`, showing "Name
    (email)" and resolving to the UUID — chosen over a paste-a-UUID field, which was the read-only page's filter
    style) + a plan dropdown fed by `fetchSubscriptionPlans` (**ACTIVE plans only**, matching the backend's
    `requireActivePlanByCode`) + an optional expiry. Empty expiry ⇒ the backend applies the plan's own period.
  - **Edit modal (per row):** plan / status / expiry. **All four statuses** are exposed (PENDING/ACTIVE/EXPIRED/
    CANCELED) — the point of manual control is fixing bad state, incl. reactivating a wrongly-cancelled
    subscription (product decision, confirmed). **Only CHANGED fields are submitted** (each compared against the
    value the modal opened with), which matches the backend's non-null-only partial update — so an untouched plan
    or expiry is preserved rather than rewritten. Verified live: a status-only edit flipped the status and stamped
    `canceledAt` while leaving plan + expiry intact.
  - **Payer column fix (included by decision):** the table showed the raw `payerUserId` even though the backend has
    returned `payerName`/`payerEmail` since the 2026-07-19 enrichment (`normalizeSubscription` spreads them
    through, so no api change was needed). Now renders name + email beneath, **UUID kept as the fallback** when
    unresolved — same pattern as the org tables. Closes a known backend-§23 display gap.
  - **Dates:** `datetime-local` ⇄ `Instant` helpers (`toInstant`/`toLocalInput`) convert across the admin's local
    zone, so a stored UTC expiry pre-fills as local time and is sent back as UTC.
  - **Localization (both directions, §6b-bis):** English-source labels ("Grant subscription", "Edit subscription",
    "Save changes", "Select a plan", "Expiry"…) got `az` entries; AZ-source feedback ("Abunəlik verildi.",
    "İstifadəçi və plan seçilməlidir."…) and the picker labels got `en` fallbacks. **The edit modal's payer name is
    `data-i18n-managed`** — it is user data resolved at runtime, exactly the §6b/2026-07-25 class of bug where the
    observer reverts a node to its first-seen text. `AdminSearchSelect` already carries that fix, so the picker
    inherited it (verified in-browser: selecting a user persists and does **not** revert to the placeholder).
  - **Verified live:** grant → ACTIVE with the 30-day plan term (DB-confirmed), appears atop the reloaded list;
    status-only edit → CANCELED + `canceled_at`, plan/expiry unchanged; unknown plan code → 404; unknown
    subscription id → 404; both actions audited (`SUBSCRIPTION_GRANTED`/`SUBSCRIPTION_UPDATED` rows present); full
    AZ render; EN toggle across the button/8 table headers/modal title/intro/labels/footer; the validation guard
    ("A user and a plan must be selected.") localizes and keeps the modal open; **zero console errors**. Test rows
    were deleted afterwards (dev data back to its original 11 subscriptions, §28); audit rows were deliberately
    left (the log is append-only).

- **Session handoff + repo publish (2026-07-25).** Finalized the project for handoff. **(1) Repo published:** added
  `origin = github.com/khanaliyevelgun/testaz-frontend` (replacing the template's stale `xsonmsc/eduall` remote) and
  pushed `main` (full history, upstream tracking set). Verified no secrets are tracked (`.env` holds only the public
  `NEXT_PUBLIC_API_BASE_URL`; `node_modules`/`.next` gitignored). **(2) Two audits completed** (documentation-only, no
  code change): a Backend↔Frontend parity audit and a final feature-completeness audit — both concluded the frontend
  and backend have reached **feature parity** except the intentionally-deferred admin manual subscription grant/modify
  UI. Confirmed zero unused `api.js` wrappers, zero TODO/FIXME/stub markers, every sidebar link resolves to a real page,
  and all four roles' flows are wired end-to-end. **(3) Cleanup decision:** a scripted comment-strip was attempted but
  **reverted** — it broke a regex literal in `lib/questionContent.js` (`/^https?:\/\//`); per the user's call, the
  explanatory 'why' comments are KEPT (they're the project standard and document real gotchas like the i18n-observer
  revert), and no code was changed in this handoff. The 6 unreachable dead scaffolding routes (`/admin/child`,
  `/admin/parent`, `/admin/messages`, `/admin/my-courses`, `/admin/wishlist`, `/admin/courses/**` + `AdminPlaceholderPage`)
  were left in place by decision (they're harmless — unreachable via the UI — and removing them is deferred; see §14).
  **(4) CLAUDE.md polished** into a complete current snapshot (this file): §0.5 handoff state, route count 50→65,
  §14/§16/§17 refreshed. Build green (65 routes), i18n audit green (189 files). No in-flight partial work.
- **Bugfix batch — live-testing findings (2026-07-25).** Five issues the user hit while click-testing the running
  app on `localhost:3001`; all diagnosed against the live backend (`:8080` was reachable) + in-browser repro. Build +
  i18n audit green (65 routes, 189 files). Branch `fix/live-testing-bugs`.
  - **Bug 2 (subject/topic picker selection didn't persist) — ROOT CAUSE + fix, the important one.** On
    `AdminExamFormPage` (and any `AdminSearchSelect`: exam-form subject/topic, question-list subject/topic filters),
    choosing an option left the trigger showing the placeholder ("Fənn axtar…") and the topic dropdown stayed
    disabled ("Əvvəl fənn seçin"). **Diagnosed via the React fiber:** the component STATE was correct
    (`subjectId:"2", subjectLabel:"Fizika (PHYSICS)"`) but the DOM text stayed the placeholder. Cause: the
    `LocaleProvider` runtime i18n `MutationObserver` (§6b) caches each text node's FIRST-seen value and, on any later
    mutation, **reverts the node to that cached original if it's a known translation key** (`localizeStaticContent`
    uses `original.trim()`, not the current value). So when React updated the trigger's text node from the placeholder
    to the selected label, the observer overwrote it back to the placeholder. **Fix:** mark the `AdminSearchSelect`
    value `<span>` `data-i18n-managed='true'` (the observer skips such subtrees) and translate the placeholder up-front
    via `tx()` (since the observer no longer touches it); the selected label is user data, shown verbatim. Verified
    live: selecting "Kimya (CHEM)" now persists and enables the topic dropdown. **Lesson (§6b):** any element whose
    text changes at RUNTIME and whose initial text is a translation key must be `data-i18n-managed` — otherwise the
    observer reverts it. This is the same class of risk §6b warns about, now bitten + fixed for the shared primitive.
  - **Bug 1 (home-page "Qeydiyyatdan keç" → 404).** The marketing CTAs pointed at a non-existent `/course` route
    (`BannerOne`) / an empty `href=''` (`CertificateOne`). Fixed: both register CTAs → `/sign-up`; two generic
    "Ətraflı oxu"/"Daha çox" CTAs (`AboutOne`/`AboutTwo`, also `/course`) → `/about`. No `/course` or empty-href CTA
    remains.
  - **Bug 3 ("Sinif"/"Çətinlik" filter caret overlapping the text).** The template's `.px-16` utility sets
    `padding-inline:16px !important`, overriding Bootstrap's ~2.25rem right padding on `.form-select`, so the dropdown
    caret (an SVG background) overlapped the option text on the narrow filter selects. Fixed with a scoped
    `globals.scss` rule `select.form-select.px-16 { padding-right: 2.5rem !important }` (higher specificity; only
    `.form-select`, so text inputs are unaffected).
  - **Bug 5 (English string on the profile page).** "You can withdraw a parent's access at any time." was an English
    `StaticText` literal with no AZ translation. Converted to the AZ source + EN fallback (§6b).
  - **Bug 4 (official Buraxılış exam "shows no questions") — NOT A BUG (could not reproduce).** Verified via the API:
    a fresh Buraxılış session returns **85 questions, all with non-empty stems** (Q1 is `SHORT_TEXT` → renders a
    textarea, not options; the rest render options), and the runner renders them correctly (confirmed by the user's own
    screenshot showing "Sual 2" with 4 options). Likely a UX perception: Q1 is short-text (no visible options) and the
    85-tile question navigator pushes the question below the fold. No code change. *(If it recurs, capture the exact
    session id + which question index looks blank.)*
- **Feature — self-service profile edit (`PUT /users/me`) (2026-07-24).** Closed the parity-audit 🟡 gap: any
  authenticated user can now edit their **own** name/email/phone (previously `AccountProfilePage` showed these
  read-only and only edited grade [student] / notify-pref [parent]). New api wrapper `updateMyProfile` (`PUT
  /users/me`) + an editable **"Basic information"** form on `AccountProfilePage` (all roles). No new route/page — a
  single-component enhancement. Build + i18n audit green (65 routes, 189 files). Branch `feat/self-profile-edit`
  (`--no-ff` merge to `main`, per §24).
  - **The form** (name/email/phone) sits after the header, above the role-specific forms; the Account-ID + Roles
    stay as read-only display. Only **non-empty** fields are sent (`updateMyProfile` — the backend applies only
    non-null; an empty string would fail its `@Email`/`@Pattern`); a client-side guard blocks removing the last
    contact (mirrors the backend's "at least one contact" rule → localized message). On success it updates local
    state AND calls `useAuth().loadProfile()` so the sidebar greeting / profile dropdown pick up the new name.
  - **Re-verification UX** (the backend resets `emailVerified`/`phoneVerified` when email/phone changes): each of
    email/phone shows a **Verified / Not verified** badge derived from the SAVED `basicInfo` — the badge is shown
    only while the input still matches the saved value, so **editing the field hides the badge**, signalling the
    change will need re-verification. A note above the form states this explicitly.
  - **Localization:** AZ source for the note/badges/messages (+ EN fallbacks); "Basic information" `az`/`en`
    fallbacks (both directions); the backend states (`Email/Phone is already registered`, `A user needs at least
    an email or a phone`) localized via `api.codes.*`. The admin-account note was reworded (it now clearly refers
    to managing OTHER users from the Users page, since the admin can now self-edit here).
  - **⚠️ Verification note:** build compiles clean (proves the wrapper + wiring), i18n audit green, all utility
    classes + i18n keys confirmed present, and the API shape was checked against the backend DTOs
    (`MyProfileResponse`/`UpdateMyProfileRequest`). **Live E2E was NOT run — Docker Desktop was down this session**
    (Postgres/Redis unavailable → the backend couldn't serve). The backend `PUT /users/me` behaviour is already
    covered by `SelfProfileEditIntegrationTest` (one of the 131 green backend tests: name-only keeps flags,
    same-email keeps flag, changing email/phone resets the flag, duplicate email → 409). Re-run the in-browser
    flow once Docker is back if you want a live confirmation.
- **Polish — drop the secondary student UUID from org tables (2026-07-24, user decision).** Resolved the §15
  "student-name secondary UUID" item: the small `font-monospace` secondary-text UUID shown under a student's
  name in `OrganizationMembersPage` (members table) and `OrganizationInvitesPage` (test-results table) is
  removed — when a `studentName` exists, only the name shows now, for a cleaner look. The UUID is **kept as the
  fallback** when a row has no resolved name (it's then the only identifier), and `AdminExamAttemptsPage` already
  showed name-or-UUID with no secondary line (unchanged). Pure display simplification (a `<span>` removed);
  build + i18n audit green (65 routes, 189 files). Branch `chore/drop-secondary-uuid` (`--no-ff` merge to
  `main`, per §24).
- **Polish — effect cleanup (auth redirect timers + exam countdown) (2026-07-24).** Two §15 correctness items,
  no behaviour change; build + i18n audit green (65 routes, 189 files). Branch `chore/effect-cleanup`
  (`--no-ff` merge to `main`, per §24).
  - **Auth redirect timer cleanup:** `SignInInner`/`SignUpInner`/`ResetPasswordInner` now store the post-action
    `setTimeout(() => router.replace(…))` in a `redirectTimerRef` and clear it in an unmount cleanup effect — no
    stray navigation if the user leaves before the ~1s redirect fires. (Was harmless but a StrictMode-warning
    source.)
  - **Exam countdown-interval churn:** `ExamSessionPage`'s 1-second countdown effect no longer depends on the
    `submit` `useCallback` (which changes on every answer, since it closes over `session`) — that dependency tore
    down and recreated the interval each time the student answered. `submit` is now held in a `submitRef` (kept
    current by its own tiny effect), so the interval effect depends only on `session?.expiresAt`/`session?.status`
    and survives across answers. The deadline still comes from the real `expiresAt`; behaviour is identical.
- **Polish — card/detail-page loading skeletons (2026-07-24).** Resolved the §15 "card/detail-page skeletons"
  item: the plain `<p>Loading…</p>` on single-record detail/form cards is replaced with a reusable
  **`AdminCardSkeleton`** (the non-table sibling of `AdminTableSkeleton`). No layout/behaviour change; build +
  i18n audit green (65 routes, 189 source files). Branch `chore/card-skeletons` (`--no-ff` merge to `main`, per §24).
  - **New** `components/admin/AdminCardSkeleton.jsx` (`rows` + optional `columns` [1 stacked / 2 two-up]) — renders
    `rows` shimmer field-rows (a short label line above a taller input line), reusing the existing `.skeleton`
    shimmer (globals.scss, prefers-reduced-motion aware) + a visually-hidden `role="status" aria-live="polite"`
    loading announcement. A new `.skeleton-input` SCSS block (44px, rounded-pill) backs the input line.
  - **Applied to 8 pages:** `AdminUserFormPage`/`AdminSubjectFormPage`/`AdminTopicFormPage`/`AdminQuestionFormPage`
    (forms), `AdminExamDetailPage`/`AdminExamStatisticsPage` (detail), `AccountProfilePage`/`AccountSettingsPage`.
    Each swaps its `isLoading` `<p>` for `<AdminCardSkeleton rows={…} [columns={1}]>`. Non-page-level loading
    text (e.g. `AdminQuestionFormPage`'s image-upload `loadingText`/button spinner) is untouched.
  - **Verified:** build compiled clean (component + all 8 wirings); the new `.skeleton-input` CSS confirmed in the
    compiled bundle (`display:block;height:44px;width:100%;border-radius:50rem`); i18n audit green; every import
    used, no leftover page-level `<p>Loading…</p>`. *(In-app browser E2E skipped — the browser pane was stuck this
    session; the skeleton is a pure CSS-driven component with no logic, and its `AdminTableSkeleton` sibling using
    the identical `.skeleton` mechanism is already proven in production.)*
- **Polish — params-based i18n for dynamic strings (2026-07-24).** Resolved the §15 "params-based i18n" item
  (the last non-interpolated English UI strings): the handful of user-facing messages built with template
  literals now use the key-based **`t("messages.<key>", params)`** helper (§6a, `{{param}}` interpolation) instead
  of English `${…}` literals. No layout/behaviour change; build + i18n audit green (65 routes, 188 files, 3526
  locale entries). Branch `chore/dynamic-string-i18n` (`--no-ff` merge to `main`, per §24).
  - **New `messages` namespace** in `az.json`/`en.json` (12 keys): `assignmentsAdded` ({{count}}),
    `templateLoadedNamed` ({{name}}) / `templateLoaded`, `sectionSubjectRequired`/`sectionTopicRequired`/
    `sectionCountRequired` ({{number}}), `fieldRequired` ({{label}}) / `fieldRange` ({{label}}/{{min}}/{{max}}),
    and four field-label keys (`labelQuestionCount`/`labelDuration`/`labelMaxUses`/`labelInviteLifetime`).
  - **Wired 3 components** via `useTranslation()`: `AdminExamDetailPage` ("N assignment(s) added"),
    `AdminExamFormPage` ("Template loaded: …" + the three "Section N: … is required" validations),
    `OrganizationInvitesPage` (the `validateRange` helper — now takes `t` + an already-localized label, since it's
    module-level and can't use the hook itself; called with `t("messages.label*")` labels). The `${template.name}
    copy` name-prefill and `#${id}` display literals are NOT messages (left as-is).
  - **Why `t(key, params)` not the DOM-observer path:** these strings are set into `error`/`notice` state and
    rendered as raw text with interpolated values, which the source-string DOM-translation (§6b-bis) can't reach —
    the key-based `t()` (which already existed, §6a) is the right tool and interpolates `{{param}}` at build time.
  - **Verified:** build compiled clean (proves the `t` wiring at every call site); i18n audit green; the exact
    key-resolution + `{{param}}` interpolation checked against the real `translate`/`interpolate` impl in both
    locales (AZ: "3 təyinat əlavə edildi.", "Bölmə 2: fənn seçilməlidir.", "Müddət 1 ilə 600 arasında olmalıdır.";
    EN: "1 assignment(s) added.", "Section 3: question count is required."). *(In-app browser E2E was skipped —
    the browser pane was stuck this session; a pure-i18n string change is fully covered by the static + logic
    verification.)*
- **Feature — exam share-token regeneration (2026-07-24).** Wired the LAST §16 endpoint,
  `regenerateExamShareToken`, into the exam detail page (`AdminExamDetailPage`) — an exam owner rotates a leaked
  share code. **The §16 intentionally-unimplemented backend-API list is now EXHAUSTED.** Investigation found the
  page already wired the other owner ops (archive/unarchive/delete/assignments); only this one had a ready
  `api.js` wrapper but no UI. No new route/page — a single-component enhancement. Verified end-to-end against the
  live backend + DB in-browser (both locales); build green (65 routes, unchanged) + `i18n:audit` green (188
  files). Branch `feat/exam-regenerate-share-token` (`--no-ff` merge to `main`, per §24).
  - **Change:** a **"Regenerate code"** button (`ph ph-arrows-clockwise`) next to "Copy link" in the exam-link
    section, plus a hint line ("Regenerating the share code makes the old link stop working immediately"). Click →
    a `window.confirm` (matching the page's existing archive/delete/revoke pattern) → `regenerateExamShareToken(examId)`
    → `loadExam()` reloads so the displayed link updates to the **new** code (the regenerate response is only
    `{examId, shareToken}`, not the full exam, so it can't reuse `runAction`'s set-updated-exam path). Success
    notice: "The share code was regenerated. The old link no longer works."
  - **Product decisions (asked & confirmed):** proceed with wiring the button (the last §16 gap); require a
    **confirmation** before rotating (it immediately breaks any already-shared link — anyone holding the old link
    can no longer open the exam).
  - **Backend contract verified:** regenerate → new `shareToken`; the **old code's `/preview` then 404s** and the
    new code works (rotation is immediate). Verified in-browser: link updates on confirm, cancel leaves it
    unchanged, EN toggle (button + hint), mobile (button wraps, no h-scroll). i18n: AZ source for the copy +
    "Regenerate code" `az`/`en` fallbacks (both directions); the `window.confirm` string is AZ-only (correct — the
    DOM walker can't reach a browser dialog, §6b-bis).
- **Feature — official exam simulations (2026-07-24).** Implemented the two remaining §16 read endpoints
  (`fetchExamDefinitions`/`fetchExamDefinition`) paired with the `OFFICIAL_EXAM` start flow: a student browses the
  **Buraxılış/Qəbul blueprints and starts the real timed simulation** — the product's headline student use case.
  No redesign; reuses the existing design language + session runner. Verified end-to-end against the live backend +
  DB in-browser (both locales); frontend build green (**65 route-table entries** — the new `/admin/official-exams`) +
  `i18n:audit` green (188 files); backend `./gradlew build` green (**131 tests** — see the cache fix below). Branch
  `feat/official-exams` (`--no-ff` merge to `main`, per §24).
  - **New page** `components/admin/ChildOfficialExamsPage.jsx` + thin route `app/admin/official-exams/page.jsx`
    (`RoleProtectedRoute allowedRoles={["child"]}`). Two selectable exam **cards** (questions/duration/max-score/
    negative-marking summary, from `fetchExamDefinitions`); selecting one loads its full blueprint
    (`fetchExamDefinition`) → for **Qəbul** a **group selector** (I_RI/I_RK/II/III_DT/III_TC/IV) reveals that group's
    **weighted subject-slot breakdown** (subject NAME via a `fetchPublicSubjects` code→name map, question count,
    closed/open split, max points); **Buraxılış** (single group) shows its 3 slots directly. A **confirmation dialog**
    ("This is a timed official exam; the countdown begins now — 180 minutes", with the exam + group) gates the start,
    then `startSession({ type: "OFFICIAL_EXAM", examCode, examGroupCode })` → `router.push('/admin/exam-session/{id}')`
    (the existing runner; the 180-min timer runs). Verified: full Buraxılış start → runner with 85 questions +
    "179:55" countdown; Qəbul I_RI slot breakdown (Riyaziyyat/Fizika/İnformatika, 150/150/100).
  - **Product decisions (asked & confirmed):** feature = official exams (highest-value remaining §16 item — the
    headline student flow); selection UX = **two cards + group dropdown with the blueprint detail shown on select**;
    start = **behind a confirmation dialog** (a 180-min timed high-stakes exam should not start on an accidental click).
    Nav: child sidebar **"Official exams"** item (`ph ph-graduation-cap`, after Practice); route guard
    `authRoles.js` `routeRoles` (`/admin/official-exams` → `["child"]`).
  - **Graceful exhaustion (422):** an official exam needs a large pool of UNSEEN questions per subject slot (Qəbul =
    22 closed + 8 open × 3 subjects); the seeded bank can run dry for a student who has practised those subjects. The
    page shows the backend message **plus an actionable localized hint** ("try another group or exam") rather than a
    dead end. The static backend states (`examGroupCode is required`, `no questions … to assemble`) are localized via
    `api.codes.*` keys.
  - **Localization (both directions):** AZ source for the page copy (heading/subtitle/card badges/table headers/
    group label/confirm dialog/buttons/hint) with EN fallbacks in `staticFallbackTranslations.en`; the English-source
    label "Official exams" (sidebar + heading) got `az` ("Rəsmi imtahanlar") + `en` (identity) fallback entries so both
    toggle cleanly. Exam names are user data (never translated). Verified: full AZ render, EN toggle (heading/cards/
    table/dropdown/buttons switch), mobile stack (375px, cards full-width, table scrolls internally), confirm dialog.
  - **⚠️ Backend fix included (`fix/exam-blueprint-cache-serialization`, merged to backend `main`).** This feature was
    the first frontend consumer to read `/exam-definitions` repeatedly and exposed a **Redis-cache-serialization bug**:
    the endpoints returned **500 on the second (cache-served) read** because the cached value was a `Stream.toList()`
    immutable list, which `GenericJackson2JsonRedisSerializer` can't deserialize. Fixed in `ExamServiceImpl` (mutable
    `ArrayList`s throughout the cached object graph) + a regression test reading each endpoint twice. Backend 130 →
    **131 tests**. No frontend code depended on the bug — it just unblocks this page. (Details in the backend
    CLAUDE.md §22.)
- **Feature — org-invite redemption (2026-07-24).** Implemented the §16 `redeemOrganizationInvite` integration:
  a student **joins a course/tutor/school test by code**. Previously the only "take by code" flow was exams;
  students in an organization had no way to redeem their teacher's join code. No redesign; reuses the existing
  design language + session runner. Verified end-to-end against the live backend + DB in-browser (both locales);
  production build green (**64 route-table entries** — the new `/admin/join`) + `i18n:audit` green (186 files).
  Branch `feat/org-invite-redeem` (`--no-ff` merge to `main`, per §24).
  - **New page** `components/admin/ChildJoinPage.jsx` + thin route `app/admin/join/page.jsx` (`Suspense` +
    `RoleProtectedRoute allowedRoles={["child"]}`). A single code field (auto-uppercased, `maxLength 16`,
    `?code=` deep-link prefill) → `redeemOrganizationInvite(code)` → **join + start/resume in one step** → the
    backend returns a `SessionResponse`, and we `router.push('/admin/exam-session/{id}')` (the existing
    `child`-guarded `ExamSessionPage` runner). Org fixed-tests are typically **timed** — the runner's countdown
    starts at join, which the page copy states up front.
  - **Terminal-session handling** (mirrors `ExamTakePage`): redeeming a **finished one-shot** returns the
    terminal session (get-or-resume), so instead of dropping into the read-only runner the page shows an
    "already completed → View results" info banner (`TERMINAL_SESSION_STATUSES` = SUBMITTED/EXPIRED/ABANDONED).
  - **Product decisions (asked & confirmed):** feature = org-invite redemption (highest-value remaining §16 item);
    placement = **new `/admin/join` sidebar page ("Join by code", `ph ph-sign-in`, after Assignments) + a
    "Join by code" CTA button on the Assignments page header**; flow = **straight into the runner** on success
    (the backend does join+start in one step — no separate preview). Route guard `authRoles.js` `routeRoles`
    (`/admin/join` → `["child"]`).
  - **Error UX:** a wrong/unknown code is a **dynamic 404** ("Invite not found: <code>") the API-message localizer
    can't map — the component detects `status === 404` and shows a clean localized message ("No such invite code
    was found…"); the code field clears its error on edit. The static backend states ("This invite is no longer
    active" / "…has expired" / "organization is no longer active" / "…reached its maximum number of uses") are
    localized via `api.codes.*` keys in `az.json`/`en.json` — so every redeem outcome reads in Azerbaijani.
  - **Localization (both directions):** AZ source for the form copy (heading/subtitle/label/placeholder-note/
    button/hint/terminal-banner) with EN fallbacks in `staticFallbackTranslations.en`; the English-source label
    "Join by code" (sidebar + CTA + heading) got `az` ("Kodla qoşul") + `en` (identity) fallback entries so both
    toggle cleanly. Verified in-browser: fresh join → runner (8-question timed org test, countdown running);
    re-redeem idempotent; finished one-shot → "already completed" banner → View results (read-only runner);
    bad code → localized 404; EN toggle (heading/label/button/hint/sidebar all switch); mobile stack (375px);
    label↔input `htmlFor`/`id` a11y.
- **Feature — ad-hoc practice-session start (2026-07-24).** Implemented the §16 `startSession` integration:
  students can now **self-start a practice test** (the core "take tests independently" promise — previously a
  student could only take exams by share code / parent assignment / org invite). No redesign; reuses the existing
  design language + session runner. Verified end-to-end against the live backend + DB in-browser (both locales);
  production build green (**63 route-table entries** — the new `/admin/practice`) + `i18n:audit` green (184 source
  files). Branch `feat/practice-session-start` (`--no-ff` merge to `main`, per §24).
  - **New page** `components/admin/ChildPracticePage.jsx` + thin route `app/admin/practice/page.jsx`
    (`RoleProtectedRoute allowedRoles={["child"]}`). A form (subject **required** + difficulty **required** +
    optional topic + question count 5–50, default 20) → `startSession({ type: "PRACTICE", subjectId, topicId?,
    difficulty, count })` → `router.push('/admin/exam-session/{id}')` (the **existing** `ExamSessionPage` runner,
    already `child`-guarded — so autosave/submit/scored-result all reuse the proven exam-taking flow; practice
    sessions are untimed → the runner shows "Vaxtsız"). Grade is intentionally left unset (backend treats null
    grade as "any grade", matching the seeder's grade-agnostic practice sessions — avoids over-narrowing → 422).
  - **Taxonomy source:** uses the **public** `fetchPublicSubjects` (`GET /subjects`) + `fetchPublicTopics`
    (`GET /subjects/{code}/topics`) — NOT the admin `/admin/subjects` variants (a STUDENT can't call those). Subject
    change reactively loads that subject's topics (optional filter; a load failure just hides the filter).
  - **Product decisions (asked & confirmed):** feature = ad-hoc practice (highest-value §16 gap); inputs =
    subject+difficulty+topic+count (grade left unset); placement = **new sidebar item + dashboard CTA**. Added
    `childSidebarItems` "Practice" entry (`ph ph-exam`, between Dashboard and Assignments) + a "Practice" quick-link
    in the child dashboard's Quick-access panel (`getChildDashboard.quickLinks`). Server-side route guard added to
    `authRoles.js` `routeRoles` (`/admin/practice` → `["child"]`) so `middleware.js` enforces it.
  - **UX for exhaustion (422):** a narrow (topic + difficulty) selection can genuinely run the unseen-question bank
    dry (per-topic ACTIVE counts are small in the seed; AI replenishment is off with no Claude key). The page shows
    the localized backend message **plus an actionable hint** ("choose All topics / try another difficulty") instead
    of a dead end, and clears stale error/hint on any field change. (Backend `count` is a target, not a floor — it
    serves however many unseen exist, so a real 422 only occurs at **zero** unseen.)
  - **Localization (both directions):** AZ is the source for the form copy (heading/subtitle/labels/options/
    button/hint) with EN fallbacks in `staticFallbackTranslations.en`; the English-source labels "Practice"
    (sidebar + quick link) and the difficulty options ("Asan"/"Orta"/"Çətin") got matching `az`/`en` fallback
    entries so both toggle cleanly. Also localized the backend practice messages via `api.codes.*` keys in
    `az.json`/`en.json` ("No unseen questions…" → AZ, plus the subject/difficulty-required message) — benefits the
    whole app, not just this page. Verified in-browser: full AZ render, EN toggle (heading/labels/difficulty/nav all
    switch), mobile stack (375px, 4 fields full-width, no h-scroll), and label↔select `htmlFor`/`id` a11y links.
- **Finalization — merge to `main` + localization follow-up (2026-07-24).** The whole 2026-07-23 session
  (remaining-issue fixes + the 5-batch UX/accessibility polish) was committed and **merged to `main`** via
  `refactor/frontend-review-2` (`--no-ff`, branch deleted; build green, 50 routes). Two stale already-merged branches
  were pruned; `main` is the single branch. **Backend side:** the three un-merged backend branches
  (`feat/member-result-student-names`, `feat/report-question-identification`, `fix/cors-allowed-origins-yaml`) were
  merged into backend `main` too (full `./gradlew build` green, 130 tests). **Localization follow-up:** a final sweep
  caught 3 static English strings missed in Batch 1 (they used `setResultError` / a returned validation string in
  `OrganizationInvitesPage`, which the Batch-1 `setError(` grep didn't match) — localized to AZ + EN fallback. A
  full re-sweep now shows **zero** non-interpolated English UI strings remain; only the *dynamic* template-literal
  strings are still English (deferred — §15). No layout/logic change.
- **UX polish — Batch 5: placeholder localization + keyboard focus ring (2026-07-23).** No layout change; build +
  i18n audit green (50 routes, 182 files). **(1) Placeholders:** localized 26 mixed-English input placeholders across
  15 components to Azerbaijani source form (+ EN fallback entries in `staticFallbackTranslations`, since placeholders
  are translated by the i18n observer) — e.g. `Search name or email…`, `Organization name`, `Optional note`,
  `All`/`Code`/`Count`/`Grade`. A scripted `placeholder=`-only replace (never touches `StaticText`); format hints
  (`MONTHLY`, `UUID`, the zero-UUID example) intentionally left. **(2) Focus ring:** several custom-classed controls
  (the pager, the row-action kebab trigger + its menu items, the refresh button) are not Bootstrap `.btn`s and had no
  visible `:focus-visible` state, so keyboard users lost focus. Added one consistent **keyboard-only** accent ring
  (`outline: 2px solid var(--main-600)`; `:focus-visible` so mouse clicks are unaffected) in `globals.scss`, hooked
  via stable classes `.admin-pager` / `.admin-refresh-btn` (added to those two shared components — chosen over the
  i18n-translated `aria-label` as a stable selector) + the `aria-haspopup="menu"` trigger + `role="menu"` items.
  Verified in-browser: the search placeholder shows AZ and toggles to EN; the focus rule resolves to the accent
  (`--main-600` = `hsl(145,52%,38%)`) on the pager/refresh/row-action controls.
- **UX polish — Batch 3: empty states (2026-07-23).** No layout change; build + i18n audit green (50 routes,
  182 source files). Replaced the bare gray "No X found." colspan cell in **18 admin list tables** with a reusable
  `AdminEmptyState` (`components/admin/AdminEmptyState.jsx`): a centered muted Phosphor icon (contextual per page —
  `ph-users`, `ph-books`, `ph-question`, `ph-flag`, `ph-credit-card`, …), the **existing** message passed as
  children so its translation key is preserved verbatim, and an **optional action link** — wired ONLY on the four
  pages that already have a navigable create action (Users → Create User, Subjects → Create Subject, Questions →
  Create Question, Exams → Create Exam, each reusing the page's existing keyed label + `/new` href). Read-only /
  populated-elsewhere pages (audit, reports, attempts, payments, subscriptions, results, …) get icon+message only.
  All existing utility classes/tokens (`bg-neutral-30`, `flex-center`, `w-56`, `text-2xl`) — no new styles, no
  invented icons (all Phosphor names already in use). Verified in-browser: the Users empty state (nonsense search)
  shows the `ph-users` icon + "İstifadəçi tapılmadı." + a "İstifadəçi yaradın" → `/admin/users/new` link, all
  localized and toggling to EN ("No users found." / "Create User"); the Reports empty state (DISMISSED filter)
  correctly shows icon+message with no action.
- **UX polish — Batch 2: loading skeletons (2026-07-23).** No layout change; build + i18n audit green (50 routes,
  181 source files). Replaced the single "Yüklənir…" text row in **19 admin list tables** with a reusable
  `AdminTableSkeleton` (`components/admin/AdminTableSkeleton.jsx`) that renders shimmer rows matching each table's
  column count, so the layout no longer jumps when data arrives (the app had **zero** skeletons/spinners before).
  The shimmer lives in `app/globals.scss` (`.skeleton` / `@keyframes skeleton-shimmer`, ~1.4s, built from the
  template `--neutral-30`/`--neutral-40` tokens) and **respects `prefers-reduced-motion`** (drops to a flat tint).
  Accessibility: the shimmer rows are `aria-hidden`; a single visually-hidden `role="status" aria-live="polite"`
  row announces loading to assistive tech. Verified in-browser: 25 skeleton cells (5×5) flash on the users-page
  load then get replaced by data; computed style confirms the gradient + `skeleton-shimmer` animation + neutral
  token; the reduced-motion rule is present. **Scope:** tables only — ~20 single-record **detail/form** pages still
  use a `<p>Loading…</p>` (a table skeleton doesn't fit them; a card skeleton is a possible later follow-up).
- **UX polish — Batch 4: accessibility in shared primitives (2026-07-23).** No visual redesign; build + i18n
  audit green (50 routes). One change set in the shared list-page primitives, so the fix propagates across every
  admin list (~15+ pages). **`AdminPagination`:** wrapped in a labelled `<nav aria-label>`; the page counter is
  now an `aria-live="polite"` region (screen readers announce page changes); disabled Prev/Next get a visible
  dimmed state (inline `opacity:0.5` + `cursor` — there is no opacity utility in the template, so it is scoped
  inline, no global style added). **`AdminRowActions`:** the kebab menu is now keyboard-operable — **Esc closes +
  returns focus to the trigger**, `aria-haspopup="menu"` on the trigger, `role="menu"`/`role="menuitem"` on the
  list, decorative icons `aria-hidden`. **`AdminRefreshButton`:** default label now renders through `StaticText`
  (was a raw English prop default that never translated → now "Yeniləyin"/"Refresh"), plus `aria-label` +
  `aria-busy` and `aria-hidden` on the spinner icon. **Search inputs** (3) gained localized `aria-label`s (a
  placeholder is not a reliable accessible name) and their decorative magnifier icons are `aria-hidden`. New AZ
  a11y strings got matching EN entries in `staticFallbackTranslations` (aria-labels are translated by the i18n
  observer). Verified in-browser: pagination nav/live-region/dimmed-disabled present; row menu opens with roles,
  Esc closes + focus returns; aria-labels translate on the EN toggle.
- **UX polish — Batch 1: error &amp; feedback localization (2026-07-23).** No layout/logic/redesign change;
  build + i18n audit green (50 routes, 3526 locale entries). Fixed a consistency defect where ~126 user-facing
  error, validation, success/notice, and confirmation strings were hard-coded **English** and rendered as raw
  `{error}`/`{notice}` text (bypassing `StaticText`), so the AZ-default app showed English on every failure/action.
  Converted each literal to its Azerbaijani source form (matching the existing auth-component convention — the
  runtime DOM i18n walker, §6b, translates raw `{error}` text by exact match) and added matching **EN fallback
  entries** to `staticFallbackTranslations.en` in `lib/i18n.js` so the EN toggle still works. Verified in-browser:
  a raw AZ error node toggles to English via the live i18n map. Scope: `setError`/`setNotice`/`setCopyStatus`/
  `successMessage`/`confirmation`/`window.confirm` static strings across ~24 admin components (native `window.confirm`
  strings become AZ-only — the DOM walker can't reach a browser dialog, which is correct for the launch audience).
  **Known follow-up:** a few *dynamic* success strings built with template literals (e.g. `` `${n} assignment(s) added.` ``,
  `` `Template loaded: ${name}` ``) were left English — they interpolate values and need a params-based i18n helper,
  out of scope for a string-swap pass.
- **Remaining-issues fix pass (2026-07-23).** Three §14 items resolved, each verified end-to-end
  against the live backend + DB in-browser (both locales); production build green (50 routes — the
  new `/payment/return`) + `i18n:audit` green. No redesign, no business-logic change.
  - **Payment checkout 404 → new `/payment/return` page.** Checkout's `redirectUrl`
    (`.../payment/return?ref=mock_<paymentId>`) previously hit a non-existent route. Added
    `app/payment/return/page.jsx` (thin, `Suspense`) → `components/PaymentReturnInner.jsx`: reads the
    provider's `ref`/`status`, shows **verifying → active / pending / failed**. An authenticated user's
    page polls `fetchMySubscriptions` and flips to "active" when a subscription goes ACTIVE; because the
    mock provider activates only via a **separate signed webhook** (never the redirect), a returning
    user honestly sees "processing" until/unless that webhook fires — no false "success". Public
    (checkout is reachable from `/pricing-plan`); "Back to subscriptions" points at `/admin/subscriptions`
    when signed in, else `/pricing-plan`. Verified all four states + the real backend checkout contract +
    a webhook-activated "active" render.
  - **One-shot exam "already completed" UX.** `ExamTakePage.start()` now inspects the session returned by
    `startExamByCode`: a terminal status (SUBMITTED/EXPIRED/ABANDONED — a resumed finished one-shot) shows a
    clear "you have already completed this exam / view results" banner and swaps the "Start exam" button
    for "View results", instead of silently opening the read-only runner. `ExamSessionPage` likewise shows a
    completed/expired banner + a result link when the session isn't IN_PROGRESS (replacing the bare
    "Status: SUBMITTED"). Behaviour/data unchanged (backend still resumes the session) — messaging only.
    Verified end-to-end (start completed one-shot → banner → View results → read-only runner → scored result).
  - **Refresh-token double-rotation → cross-tab guard.** Implemented the §7 guard (confirmed the
    reuse-detection mechanism against the live backend first). `authStore` mirrors the access token to a
    `localStorage` signal; `AuthProvider` adopts a sibling tab's rotated token via a `storage` event
    (and mirrors cross-tab logout); `refreshAccessToken` recovers a lost race by adopting the sibling's
    token instead of clearing auth. Additive, behaviour-preserving; normal single-tab auth + the
    401→refresh→retry path re-verified. Full detail + the deliberate no-lock limitation in §7.
  - **i18n note:** new az `StaticText` strings were given English via `staticFallbackTranslations` in
    `lib/i18n.js`; `getStaticTextTranslations` was generalized to also fold in fallback entries whose
    source string isn't in the extracted `staticSource` pipeline (previously such entries were silently
    ignored) — no effect on any existing key. Verified the header/footer translations still resolve.
- **Project handoff.** Documentation-only finalization: reworked this file into a whole-project
  entry point — added **§0 Project Overview** (product / architecture / backend summary / database
  summary / development progress) so a brand-new session understands the system without prior
  context, pointing to `testaz-backend/CLAUDE.md` for backend depth (no duplication). Re-verified
  builds/tests for handoff (frontend build + i18n audit GREEN; backend `./gradlew build` GREEN, 130
  tests); ran a repo-cleanliness scan (nothing to remove); documented the multi-branch backend
  deployment nuance (§13). No code change beyond docs.
- **Code review + API/E2E verification pass.** Refactor + three real bug fixes, all verified
  against the live backend + DB, no UI/behavior redesign:
  - **`formatDate` consolidation.** It was copy-pasted 15× across admin/dashboard components in
    three slightly-different forms. Extracted `lib/format.js` (`formatDateTime` = date + short
    time; `formatDate` = date only). Output unchanged for valid dates; the shared helpers add a
    NaN guard so a bad timestamp renders "-" instead of "Invalid Date". `AdminPaymentsPage` keeps
    its distinct `toLocaleString` variant (different output, intentionally not merged).
  - **User name shown as "İstifadeci" everywhere (bug).** `/auth/me` is intentionally minimal
    (id + roles from the JWT, no DB hit), so it never carried the display name — every screen fell
    back to the generic placeholder. The name/email/phone live on `/users/me`, which the frontend
    never called. `fetchProfile` now merges `/users/me` into the token-derived user (a failed
    `/users/me` falls back, so auth never breaks). Fixes the name across all authenticated screens.
  - **Org/exam tables showed raw student UUIDs (bug).** The org members list, org test-results
    dashboard, and exam-owner attempts view all displayed the raw studentId. Fixed on the backend
    (`MemberResponse`/`TestResultSummaryResponse` gain `studentName`, batch-resolved via
    `UserService.findBasicInfoByIds` — no N+1, same pattern as the payer-name enrichment) and the
    frontend now shows the name (UUID kept as small secondary text). New acyclic backend edges
    `organization → user` and `result → user`.
  - **Flags (not fixed — flagged for a product decision):** several backend endpoints have no
    frontend integration yet (`startSession` ad-hoc practice, `redeemOrganizationInvite`,
    `fetchExamDefinitions`, `regenerateExamShareToken`, `fetchLinkedChildren`); and the mock
    payment checkout redirects to a non-existent `/payment/return` route (real payment is
    vendor-blocked). See the review summary.
- **Follow-up fixes from the bug-hunt (report identification, trend badges, mixed-language
  strings).** Three targeted fixes + one documented watch-item:
  - **Admin reports queue showed a raw `questionId` UUID.** Root cause was backend: the report
    DTO only carried the id. Fixed on the backend (`QuestionReportResponse` gains
    `questionStem`/`questionSubjectId`, batch-resolved via the existing `getPinnedForServing`
    no-N+1 pattern — see `az.testifyaz.backend.report.service.QuestionReportServiceImpl`) and
    wired here: the "Question" column is now the question's stem, truncated, linking to
    `/admin/questions/{id}/edit`.
  - **Trend badges (`IMPROVING`/`DECLINING`/`STEADY`/`INSUFFICIENT_DATA`) were unstyled and
    untranslated.** Extended `AdminStatusBadge`'s `statusClasses` with sentiment colors
    (improving=green, declining=red, steady/insufficient=neutral) and added an exported
    `TREND_LABELS` map so the icon-led trend cells in `ChildResultsPage`/`ParentProgressPage`
    show the same localized wording as the plain-badge usage in `AdminDashboardHome` — one
    source of truth, no duplicated strings.
  - **Mixed-language strings on language switch (§6b's core risk, realized).** Several visible
    sentences were composed from multiple independently-keyed `StaticText` fragments where one
    fragment's English translation was simply missing, so switching to English left part of
    the sentence in Azerbaijani (e.g. the home-page hero heading, the marketing footer
    copyright line). Root cause was always a **missing locale-file entry**, never the
    JSX/component structure — so every fix was adding the missing `az`/`en` static-locale
    entries (source strings + hashes computed with the same algorithm as
    `scripts/extract-static-translations.mjs`, so a future extraction run won't collide).
    The one real structural fix: `OrganizationInvitesPage`/`OrganizationMembersPage` built an
    English plural by concatenating a stem + a bare `"s"` (`"result" + "s"`), which cannot work
    in Azerbaijani (no plural suffix after a numeral); changed to a `count === 1 ? singular :
    plural` branch with two independently-translated words (AZ: both branches translate to the
    same singular noun, per Azerbaijani grammar). **Lesson for future `StaticText` usage:** a
    sentence assembled from 2+ fragments is only as translatable as its least-covered fragment
    — prefer one fragment per complete, grammatically-independent phrase, and never build a
    plural by string-concatenating a suffix.
  - **Watch-item recorded, not fixed** (couldn't reproduce through normal usage): see §7's
    "possible refresh-token double-rotation" note.
- **Data-correctness bug-fix pass** (verified against the DB for every integrated read
  endpoint, all roles). Two real bugs fixed at the root:
  - **i18n enum/role corruption (critical).** `localizeApiResponse` (`lib/i18n.js`) recursed
    into every nested object/array and ran `translateApiMessage` on bare strings, rewriting
    enum-like values — most damagingly `roles: ["STUDENT"]` from `/auth/me` — into the
    `api.unknownKey` fallback error string. That broke role detection, so `RoleProtectedRoute`
    bounced every authenticated user off their dashboard, and any `status`/`type`/`role`
    badge in a list showed the error text. Fixed so only the named message fields
    (`message`/`error`/`detail`/`title`/`errors`) are translated; structural recursion never
    translates a bare data string. Error-message localization is unchanged (regression-tested).
  - **Empty result breakdown.** The backend paginated the per-question breakdown out of
    `/…/result` into `/…/result/details`, but `SessionResultPage`, `ChildResultsPage` and
    `ParentProgressPage` still read the now-absent `result.details`, so the "Sual nəticələri"
    list was always empty. Added `fetchSessionResultDetails` / `fetchChildSessionResultDetails`
    (collect all detail pages) and wired all three screens. Verified card counts match the DB.
  - Backend: fixed malformed `app.cors.allowed-origins` YAML in `application.yml` (three folded
    lines yielded broken origin tokens; `localhost:3000`/`3001` were silently rejected).
    Needs a backend restart to take effect.
- **Code-quality refactor pass.** No behavior/visual change. Extracted `AdminPagination`
  (de-duplicated the identical pager footer across 10 admin list pages); consolidated
  `normalizeRole` (removed the duplicate in `api.js`, imported from `authRoles.js`) and
  removed the unused `emptyPage`; deleted dead files (`components/InstructorOne.jsx`,
  `helper/Preloader.jsx`); fixed the stale `ProtectedRoute` reference in `README.md`;
  created this `CLAUDE.md`. Build verified green (49 routes, identical route set).

---

## 13. Frontend Review Summary (latest full review session)

A full frontend code-review + API-verification + end-to-end testing pass was completed. The
existing UI/UX/design was preserved as-is — **no redesign, no new features, no architectural
change**. Everything below was verified against the **live backend + Postgres DB** with real
seeded data (not code inspection alone).

### Frontend refactors performed
- **`formatDate` consolidation** → new `src/lib/format.js` (`formatDateTime` = date + short
  time; `formatDate` = date only). The helper was copy-pasted 15× across admin/dashboard
  components in three slightly-different forms (some without a NaN guard, one date-only).
  Output is unchanged for any valid date; the shared version adds a NaN guard so a malformed
  timestamp renders `"-"` instead of `"Invalid Date"`. `AdminPaymentsPage` keeps its distinct
  `toLocaleString` variant (genuinely different output, intentionally not merged).
- The rest of the codebase was found to be **already high quality** — no unused imports, no
  `useAuth`-function-in-effect-deps re-render loops, proper `isMounted` unmount guards in 14
  components, and correctly-cleaned timers/intervals/polling (AI-job polling, exam countdown,
  per-question autosave in `ExamSessionPage`). Working, clean code was left untouched.

### Backend bugs fixed (committed on backend feature branches)
- **Org/exam tables showed raw student UUIDs.** `MemberResponse` and
  `TestResultSummaryResponse` gained `studentName`, batch-resolved once per page via
  `UserService.findBasicInfoByIds` (no N+1 — same pattern as the payer-name enrichment in
  `SubscriptionAdminServiceImpl`). New acyclic backend edges `organization → user` and
  `result → user`. Branch: `feat/member-result-student-names`. Full `./gradlew build` green.
- (Earlier in the review cycle, also on branches: `feat/report-question-identification` — added
  `questionStem`/`questionSubjectId` to the report DTO; `fix/cors-allowed-origins-yaml` — fixed a
  malformed `app.cors.allowed-origins` default that silently rejected `localhost:3000/3001`.)

### Frontend bugs fixed (committed on `refactor/frontend-review-2`)
- **User name displayed as the generic "İstifadeci"/"Admin" on every authenticated screen.**
  Root cause: `/auth/me` is intentionally minimal (id + roles from the JWT — no DB hit), so it
  never carried the display name; the name/email/phone live on `/users/me`, which the frontend
  never called. `fetchProfile` now merges `/users/me` into the token-derived user (a failed
  `/users/me` falls back to the token user, so auth never breaks). Fixes the name across the
  sidebar greeting, profile page, and profile dropdown. Verified in-browser (shows real names).
- **Org owner / exam owner saw student UUIDs** in the org members list, org test-results
  dashboard, and exam-owner attempts view. Wired the new backend `studentName` into all three
  (`OrganizationMembersPage`, `OrganizationInvitesPage`, `AdminExamAttemptsPage`); the UUID is
  kept as small secondary text. Verified in-browser (members page now lists real names).

### Verified user flows (real data, live stack)
- **Auth:** sign-in / sign-out redirect; startup refresh → `/auth/me` → `/users/me` hydration.
- **Student:** dashboard (recent-average / best-score math cross-checked vs DB), results list
  (8 rows = DB), result detail modal (per-question breakdown 4 correct / 5 wrong / 1 blank =
  DB), question-report buttons present.
- **Exam-taking (core):** a **full fresh take** — preview → start (fresh IN_PROGRESS session,
  90-min timer) → answer all 9 (1 short-text + 8 options, autosave persisted to DB) → submit →
  async scoring → result generated in DB. Also confirmed the one-shot-resume path (starting an
  already-completed exam resumes the read-only submitted session).
- **Parent:** dashboard (linked-learner count = DB), children (uses `fetchParentDashboard`, so
  names show), notifications auto-mark-read (unread 12 → 2 after viewing page 1, DB-confirmed).
- **Organization:** my orgs, members (now with names), test-results dashboard (6 results = DB).
- **Admin:** users pagination (page 2, 31 total, 4 pages), role filter (STUDENT = 26 = DB),
  search ("orucov" → 3 = DB), audit filters (action/outcome, counts = DB), plans list,
  **subject CRUD cycle** (create → update → deactivate, DB-verified), AI generate (job created,
  gracefully FAILED "Claude API unavailable" — no key configured, expected degradation).
- **Subscriptions/payments:** plans list (prices correct), entitlement, checkout (creates
  PENDING subscription + returns provider redirectUrl — mock flow, see Remaining Issues).

### API verification completed
Every read endpoint the frontend integrates was cross-checked against direct DB queries — all
matched (counts, pagination `page`/`size`/`totalElements`/`totalPages`, filter/search results,
per-row values). The `api.js` layer is uniform (`normalizePage` + `toQueryString` everywhere),
so the verified patterns hold across all list endpoints. `meta.page` 1-based↔0-based conversion
confirmed correct.

### Database verification completed
Used direct `psql` queries against the `testaz` Postgres (via the `testaz-postgres` container,
`testaz/testaz`) to confirm displayed data matches stored rows for every checked screen.

### Testing completed
Manual E2E in the in-app browser against the live backend (there is no automated FE test suite,
§10). Backend changes covered by the existing 130-test suite (`./gradlew build` green).

### Branches created
- **Frontend** (`eduall/`): `refactor/frontend-review-2` (formatDate consolidation, name-display
  fix, org student-name display, this doc). Committed locally — at the time, **not pushed / not merged**
  per the then-standing "commit-only for the assistant" instruction. *(Historical: that branch was later
  merged to `main` — see §12 "Finalization" 2026-07-24 — and the commit-only rule is **superseded by §19**,
  which now mandates commit → push → merge → push `main`.)*
- **Backend** (`testaz-backend/`): `feat/member-result-student-names`,
  `feat/report-question-identification`, `fix/cors-allowed-origins-yaml`. Committed on branches;
  `main` untouched.

### Important implementation decisions
- **`fetchProfile` merges `/users/me`** rather than making `/auth/me` do a DB lookup — preserves
  the deliberate stateless/no-DB-hit design of `/auth/me` while still getting the display name.
  The merge fails soft (auth never breaks if `/users/me` errors).
- **Student-name enrichment is a live batch lookup, not a stored snapshot** — mirrors the
  established `findBasicInfoByIds` payer-name pattern; the owner sees the student's current name.
- **Did NOT extract a `useAdminList` hook** despite the list-page state-machine duplication —
  CLAUDE.md §8 warns it must preserve each page's exact debounce/reload timing, and touching 35
  files risks more than the marginal gain (see Future Improvements).
- **Did NOT touch working, clean code** just to "improve" it — the review confirmed most of the
  codebase is already sound.

### Session finalization (handoff verification)
- **Builds/tests re-verified for handoff:** frontend `npm run build` GREEN (49/49 routes, no
  warnings) + `i18n:audit` GREEN (178 source files, 3526 locale entries); backend
  `feat/member-result-student-names` `./gradlew build` GREEN (all 130 tests). No in-flight partial
  work — everything is committed.
- **Repository cleanliness (step-8 scan):** no unused imports, no genuinely dead code, no obsolete
  comments found to remove. The only "unused" `api.js` exports are the intentionally-deferred §16
  endpoints (keep) plus `fetchMyProfile` (used internally by `fetchProfile`, and a valid public
  wrapper for a future self-service profile-edit UI). **Nothing was deleted.**
- **⚠️ Backend deployment nuance (important for a live demo / merge planning).** The three backend
  fixes live on **three independent branches** (each branched separately from `main`); **no single
  branch contains all three**. The running local backend serves the jar built from whichever branch
  was last deployed (currently `feat/member-result-student-names` → so org/exam **student names are
  live**, but the report `questionStem` and the CORS default are **not** in the running instance).
  This is the expected state of un-merged feature branches, and **nothing is broken** because the
  frontend falls back gracefully everywhere (`studentName ? name : uuid`, `questionStem ? stem :
  uuid`). To get a fully-consistent running backend, **merge all three backend branches** (they do
  not conflict — different files) and rebuild/redeploy the jar. That merge awaits your approval (§9).

---

## 14. Remaining Issues

Open items that still require work. None block the verified flows.

| Issue | Why it remains | Priority | Needs product decision? |
|---|---|---|---|
| ~~6 dead scaffolding routes~~ **RESOLVED (2026-07-30)** — the 5 genuinely-unreachable ones (`/admin/child`, `/admin/parent`, `/admin/messages`, `/admin/my-courses`, `/admin/wishlist`) + `AdminPlaceholderPage` + their 5 dead `authRoles` rules were deleted (66 → 61 routes). **`/admin/courses/**` was NOT deleted — it is LIVE** (see §11 ⚠️). | Done. | — | — |
| **A few dynamic (interpolated) BACKEND messages render English/raw** (e.g. "used all free sessions this month", "Invite not found: <code>"). | They're runtime-interpolated server strings that can't map to a static `api.codes` key; common cases already have localized hints/fallbacks. | Low | No — needs a params-based server-message helper. |
| **Real Email/SMS + payment providers not wired** (backend seams ready). | **Backend-blocked** — needs vendor accounts; no frontend to build until they exist. | (blocked) | No — backend/vendor concern. |
| **No automated frontend test suite.** Verification is manual (§10). | Out of scope; ESLint is also not configured (`npm run lint` prompts interactive setup). | Low | Partially — a test stack is a project call. |

*(Resolved & logged in §12: **admin manual subscription control — grant + modify — shipped 2026-07-30, closing the
last frontend↔backend API gap**; the payment-checkout 404, one-shot-exam "already completed" UX, refresh-token
cross-tab guard [2026-07-23]; the four §16 API gaps + self-profile-edit [2026-07-24]; and the 2026-07-25
live-testing bug batch — subject-picker i18n-revert [Bug 2], home register-CTA 404s [Bug 1], filter-caret
overlap [Bug 3], profile English string [Bug 5]. Bug 4 "official exam shows no questions" was investigated and
found NOT to be a bug — the API returns 85 populated questions and the runner renders them.)*

---

## 15. Future Improvements (documented, NOT current tasks)

Non-essential suggestions for future consideration. **Do not implement these as part of a review
or refactor pass unless explicitly asked.**

- ~~**Params-based i18n for dynamic strings.**~~ **DONE (2026-07-24)** — the interpolated user-facing
  strings (`${n} assignment(s) added.`, `Template loaded: ${name}`, the `Section N: … is required.`
  exam-form validations, and the `${label} is required.` / `${label} must be between X and Y.`
  `OrganizationInvitesPage` validators) now use the key-based `t("messages.<key>", params)` helper (§6a)
  with `{{param}}` placeholders, keyed under a new **`messages`** namespace in `az.json`/`en.json`. See §12.
- ~~**Card/detail-page skeletons.**~~ **DONE (2026-07-24)** — a reusable `AdminCardSkeleton` (`rows`/`columns`
  props; the non-table sibling of `AdminTableSkeleton`, same `.skeleton` shimmer + `role="status"` a11y) now
  replaces the plain `<p>Loading…</p>` on the main single-record **detail/form** cards: the User/Subject/Topic/
  Question form pages, `AdminExamDetailPage`, `AdminExamStatisticsPage`, `AccountProfilePage`, and
  `AccountSettingsPage`. See §8 (admin primitives) and §12. *(A few smaller detail cards — e.g.
  `ParentProgressPage`'s trend cards — still use plain text; extend `AdminCardSkeleton` there if desired.)*
- **Shared `useAdminList` hook.** Would remove the remaining list-page state-machine duplication
  (~35 files) and centrally fix a latent **race condition** (rapid filter changes fire
  overlapping fetches with no out-of-order guard — low severity, unobservable on a local
  backend). Only worth doing if it **exactly preserves** each page's debounce/reload timing
  (§8) — otherwise it changes behaviour.
- ~~**Auth redirect timer cleanup.**~~ **DONE (2026-07-24)** — `SignInInner`/`SignUpInner`/`ResetPasswordInner`
  now hold the post-action `setTimeout` in a `redirectTimerRef` and clear it in an unmount cleanup effect (no
  stray `router.replace` after unmount).
- ~~**Countdown-interval churn in `ExamSessionPage`.**~~ **DONE (2026-07-24)** — the 1-second countdown effect no
  longer depends on the `submit` `useCallback` (which changed on every answer, tearing down/recreating the
  interval). `submit` is kept in a `submitRef` (updated by its own tiny effect), so the interval effect depends
  only on `session?.expiresAt`/`session?.status` and persists across answers. Behaviour unchanged.
- **Splitting `lib/api.js`** by domain (`api/auth.js`, `api/exams.js`, …) if it keeps growing —
  behind the same exported names, no call-site import changes (§5).
- ~~**Student-name secondary UUID.**~~ **DONE (2026-07-24, user decision).** The small secondary-text UUID
  under a student's name was dropped from the org tables (`OrganizationMembersPage`, `OrganizationInvitesPage`)
  for a cleaner look — when a `studentName` exists only the name shows. The UUID is still shown as the fallback
  when a member/result has NO resolved name (it's then the only identifier). See §12.

---

## 16. Intentionally-unimplemented backend APIs (DO NOT DELETE)

Some functions in `lib/api.js` wrap backend endpoints that **have no frontend UI yet**. They are
**NOT dead code** — they are the ready API surface for features planned in future iterations.

**Rules:**
- **Do NOT delete them** during a review/refactor/cleanup pass.
- **Do NOT treat them as findings** ("unused export") — they are deliberate.
- They will be wired into new UI in future feature iterations.
- Ignore them when hunting for dead code.

Currently unimplemented (verified: zero component/app usage):
- ~~**`startSession`**~~ **IMPLEMENTED (2026-07-24)** — ad-hoc practice-session start now has a full
  student UI at `/admin/practice` (`ChildPracticePage`): choose subject + difficulty + optional topic +
  count → `startSession({ type: "PRACTICE", … })` → the existing `ExamSessionPage` runner → scored result.
  See the change log §12. (`startSession` is now a live integration, not a deferred wrapper.)
- ~~**`redeemOrganizationInvite`**~~ **IMPLEMENTED (2026-07-24)** — a student joins an org and
  starts its fixed test by code via `/admin/join` (`ChildJoinPage`): enter code →
  `redeemOrganizationInvite` → the existing `ExamSessionPage` runner (or "already completed → view
  results" for a finished one-shot). Also linked from the Assignments page. See the change log §12.
- ~~**`fetchExamDefinitions`** + **`fetchExamDefinition`**~~ **IMPLEMENTED (2026-07-24)** — the official
  Buraxılış/Qəbul blueprints are now surfaced at `/admin/official-exams` (`ChildOfficialExamsPage`): a student
  browses both exams, picks a Qəbul specialization group, sees the weighted subject breakdown, and starts the real
  timed simulation (`startSession({ type: "OFFICIAL_EXAM", examCode, examGroupCode })`) via a confirm dialog. See
  the change log §12.
- ~~**`regenerateExamShareToken`**~~ **IMPLEMENTED (2026-07-24)** — the exam owner rotates a leaked share
  code via a "Regenerate code" button on the exam detail page (`AdminExamDetailPage`, next to "Copy link"):
  confirm → `regenerateExamShareToken(examId)` → the old link 404s, the displayed link updates to the new
  code. See the change log §12. **This was the LAST §16 item — the intentionally-unimplemented backend-API
  list is now EXHAUSTED.**

**Note:** `fetchLinkedChildren` was previously listed as unimplemented but **IS used** by
`AdminExamFormPage` (a parent assigning an exam to a linked child) — keep it.

**§16 status (2026-07-24): the list is EMPTY.** Every backend endpoint that had an `api.js` wrapper but no UI
is now wired: `startSession` (practice), `redeemOrganizationInvite` (join by code), `fetchExamDefinitions`/
`fetchExamDefinition` (official exams), and `regenerateExamShareToken` (this entry). If a NEW deferred endpoint
is ever added to `api.js` ahead of its UI, list it here again with the same DO-NOT-DELETE rules.

---

## 17. Next Session Starting Instructions

**Every new Claude Code session working on this project MUST, before writing any code:**

1. **Read this entire `CLAUDE.md`** end to end — §0 (project overview) first for the whole-system
   picture, then §1–§11 (frontend detail), then the handoff sections §13–§17.
2. **Understand the backend architecture** — read `testaz-backend/CLAUDE.md`; it is the
   authoritative backend + business-rule reference (§0.3 here is only a summary).
3. **Understand the frontend architecture** — §§1–11 here (routing, auth, state, API layer, i18n,
   shared components, conventions).
4. **Understand completed features** — §13 (review summary) + the change log (§12).
5. **Understand pending / intentionally-unimplemented features** — §14 (remaining issues) and
   §16 (unimplemented-but-intentional APIs).
6. **Understand the business rules** — from the backend CLAUDE.md; never infer them from the UI.
7. **Never change business logic** unless explicitly instructed.
8. **Never remove the intentionally-unimplemented frontend API integrations** in §16.
9. **Ask for clarification whenever a business or product decision is required** (see §14's
   "Needs product decision" column) instead of assuming. Design/UX changes, copy changes, and
   removing/hiding reachable features are product decisions.

Only after fully understanding the project — backend + frontend, completed + pending, and the
hard rules in §9 — should implementation begin. Preserve the existing UI/UX (it is considered
good); keep the production build green (§10); follow the **git workflow in §19** (branch → verify →
commit → push → `--no-ff` merge to `main` → push → delete the branch); and keep this file in sync
(doc-sync: update the change log §12 + the relevant section, then summarize in chat).

---

## 18. Next Task (the exact next thing to build)

The project is at **full feature parity** (§0.5) — **there is no remaining frontend-API gap.** The
admin-subscription control that this section previously named as next was **shipped on 2026-07-30** (§12). What
remains is optional cleanup and a backend-blocked launch item, in priority order:

### ⭐ Next — optional cleanup (no feature work outstanding)
1. **Delete the 6 dead scaffolding routes** (see below) — the highest-value remaining item: it removes unreachable
   surface area. Safe; verify the build after.
2. **Params-based server-message i18n** for the few dynamic backend strings (below).
3. **Consider an automated test suite** (§14) — a project call; there is none today and verification is manual (§10).

If a NEW backend endpoint lands without a UI, list it in §16 (currently EMPTY) with the DO-NOT-DELETE rules and it
becomes the next feature task.

### ✅ DONE (2026-07-30) — Admin manual subscription control (was this section's ⭐ next feature)
Shipped: `grantAdminSubscription` / `updateAdminSubscription` in `api.js` + a Grant modal (searchable user picker,
ACTIVE-plan dropdown, optional expiry) and a per-row Edit modal (plan/status/expiry, changed-fields-only) on
`AdminSubscriptionsPage`, plus the payer name/email display fix. Full detail — including the product decisions, the
partial-update semantics, and the live verification — in the change log **§12 (2026-07-30)**.

### Optional cleanup (low priority — §14)
- ~~**Delete the 6 dead scaffolding routes**~~ **DONE (2026-07-30), but only 5 of them — the 6th was NOT dead.**
  Removed: `/admin/child`, `/admin/parent`, `/admin/messages`, `/admin/my-courses`, `/admin/wishlist` +
  `AdminPlaceholderPage` + their 5 `authRoles.js` rules (66 → 61 routes). **`/admin/courses/**` was KEPT — the old
  claim that it "just re-maps subject/topic components already reachable via `/admin/subjects`" was WRONG: the
  `topics` subtree is the ONLY route to topic management (see the ⚠️ in §11). Deleting it would have broken admin
  topic CRUD.** Lesson: verify reachability by `grep`-ing for link sites before deleting a route, not by name.
- **Params-based server-message i18n:** a few dynamic backend strings (e.g. "used all free sessions this month",
  "Invite not found: <code>") render raw because they can't map to a static `api.codes` key.

### Backend-blocked (not a frontend task)
- Real Email/SMS + payment providers (backend seams ready; needs vendor accounts). No frontend to build until they
  exist; the mock payment/checkout + `/payment/return` flow already handles the client side.

### DO NOT (without an explicit request)
- Do not mechanically strip code comments (a scripted strip broke a regex in `lib/questionContent.js` — §12
  2026-07-25). Comments are the project standard ("why", not "what") and document real gotchas — keep them.
- Do not reword/reformat visible `StaticText` literals during refactors (breaks the runtime string-match i18n, §6b).
- Do not remove the §16 API wrappers or change business logic.

---

## 19. Git Workflow (MANDATORY — feature branches, NO Pull Requests)

> Mirrors the backend's `testaz-backend/CLAUDE.md` §24 so both repos follow ONE workflow. The many
> "per §24" references in the change log (§12) mean **this** section — they predate it, when the
> frontend had no git section of its own. **This supersedes the older "commit-only for the assistant"
> instruction** recorded in §13 (2026-07-25 and earlier): work is now committed, merged, **and pushed**
> without waiting for separate approval.

- **Branch per change.** Do all work on a short-lived feature branch off `main` (`feat/<topic>` or
  `chore/<topic>`). Never commit directly to `main`. **Never open Pull Requests.**
- **Finish flow — only AFTER the verification gates are GREEN** (this repo has no automated test suite, §10, so
  the gates are: `npm run build` compiles with the **route set unchanged**, and `npm run i18n:audit` passes):
  1. **Commit** the work on the feature branch.
  2. **Push** the feature branch.
  3. **Merge** the feature branch into `main` (`--no-ff`), then **push `main`**.
  4. **Delete** the feature branch (local **and** remote).
- **Merge conflicts — resolve them yourself, automatically, whenever possible:**
  1. `git fetch` the latest changes.
  2. Resolve the conflicts automatically.
  3. **Preserve all intended functionality** — never drop a feature just to make the merge succeed.
  4. **Re-run the verification gates** after resolving (build + i18n audit), and re-check any touched flow
     in the browser if the conflict was in component logic.
  5. **Commit** the conflict resolution.
- **Stop and ask the user ONLY if:** the conflict changes business logic and there is no objectively correct
  resolution; the conflict would delete/overwrite important functionality; the build/i18n audit still fails after
  multiple reasonable repair attempts; or authentication/repository permissions block completion.
- Otherwise, resolve conflicts yourself and proceed without asking.
- **Remote:** `origin` = `github.com/khanaliyevelgun/testaz-frontend` (`main`). Never commit secrets — `.env`
  holds only the public `NEXT_PUBLIC_API_BASE_URL`; `node_modules/` and `.next/` are gitignored. Stage specific
  paths (`src/`, `CLAUDE.md`, …) rather than `git add -A`, so build output never slips in.
