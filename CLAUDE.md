# CLAUDE.md — testaz (Frontend repo, `eduall/`)

> **Project entry point + frontend single source of truth.** Any Claude instance working on the
> frontend should read this file first. §0 gives the whole-project picture (product, architecture,
> backend, database, progress) so a brand-new session understands the system without prior
> conversation; §1–§11 are the detailed **frontend** reference (routing, auth, state, API layer,
> i18n, shared components, conventions); §12 is the change log; §13–§18 are the handoff sections.
>
> **The authoritative BACKEND document is `testaz-backend/CLAUDE.md`** (~3600 lines, the backend
> SSOT). §0 here summarizes it and points to it; do not duplicate backend depth into this file.
>
> **New session? Start with §17 (Next Session).** Then read §0 (project overview), then the
> frontend detail (§1–§11). Handoff sections: §13 this-session summary (incl. repo-cleanliness
> result), §14 remaining issues, §15 future improvements, §16 the intentionally-unimplemented
> backend APIs that must NOT be deleted, §17 next-session starting instructions.
>
> Keep this file in sync when you change architecture, folder structure, state management, the API
> layer, the i18n system, or shared conventions (§20-style doc-sync: update the change log + the
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
- **✅ Completed (backend):** all 17 modules; the full MVP build order (auth → taxonomy → question
  bank → AI generation → test-taking + scoring → student/parent linking → organizations →
  notifications → reports → subscriptions/payments → audit → admin → exam management) PLUS the
  deferred-feature run (trends rollups, subscription lifecycle + plan CRUD, retention jobs, AI
  runtime replenishment, org digest, exam owner lifecycle + retakes, security hardening, dev-data
  seeder). 130 tests green.
- **✅ Completed (frontend):** auth (sign-in/up, forgot/reset, refresh); role dashboards
  (admin/parent/child/organization); student results (list + paginated detail modal) + question
  reporting; exam-taking by share code (preview → start → answer/autosave → submit → scored result);
  parent dashboard/children/progress/notifications; organization management/members/invites/results;
  full admin panel (users, subjects, topics, questions + AI generation, reports, audit,
  subscriptions, payments, plans, dashboard); subscriptions/entitlement/checkout (mock); i18n
  (az/en). Production build green (49 routes).
- **🔶 In progress / this session:** frontend code-review + API/E2E verification pass — see §13. No
  in-flight partial work; all changes are committed.
- **⛔ Not yet implemented (frontend — intentional, see §16):** ad-hoc practice-session start
  (`startSession`), org-invite redemption UI (`redeemOrganizationInvite`), official exam-definition
  browsing (`fetchExamDefinitions`/`fetchExamDefinition`), exam share-token regeneration
  (`regenerateExamShareToken`). **Backend-blocked:** real Email/SMS + payment providers (vendor
  accounts needed).

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
npm run build          # production build — MUST stay green (49 routes)
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
  sign-in / sign-up / forgot-password / new-password / reset-password
  about / blog / contact / faq / pricing-plan   Template marketing pages.
  api/openapi/route.js   Serves the local openapi.yaml.

components/
  *.jsx                  Template + shared leaf components (Header, Footer, auth
                         inner forms, StaticText/StaticOption, LocaleProvider, …).
  admin/                 ALL dashboard feature components (*Page.jsx) + admin
                         primitives (AdminPagination, AdminStatusBadge, …).
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

**⚠️ Watch-item — possible refresh-token double-rotation.** While manually debugging in the
browser (calling `POST /auth/refresh` directly, outside the app's own `apiFetch`/`AuthProvider`
flow, in quick succession with the app's own startup refresh), a session got logged out: the
backend's refresh-token rotation + reuse detection revoked the whole token family, because two
refreshes raced on the same pre-rotation token. This was **not reproduced through normal app
usage** (`apiFetch`'s single shared `refreshPromise` — see §5 — already dedupes concurrent
refreshes within one tab), so it is not a confirmed bug, just a plausible mechanism if a
future report surfaces as "random logouts" — for example, two tabs/windows both hitting a 401
at nearly the same instant, each running its own `refreshPromise` (the dedupe is per-tab, not
cross-tab). If that's ever reported, start by checking whether it correlates with multiple
open tabs, and check the backend's `refresh_tokens` table for a family with many rows all
`revoked_at` set close together (the reuse-detection signature) around the report time.

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
  - **`AdminStatusBadge`**, **`AdminRowActions`** (kebab dropdown), **`AdminRefreshButton`**,
    **`AdminSearchSelect`**, **`AdminGradeSelect`**, **`AdminRichTextEditor`** — reuse these.
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
7. **Keep the production build green** (`npm run build`, 49 routes). Verify after any change.
8. Prefer reusing the admin primitives (§8) over re-implementing pagers/badges/dropdowns.

---

## 10. Verifying "nothing changed" after a refactor

The app has **no automated test suite**, so verification is manual:

1. `npm run build` must be green with the **same 49 routes / 62 route entries** as before
   (compare the route table; static vs dynamic markers unchanged).
2. Run `npm run dev` and walk the major flows: sign-in → dashboard per role; a student
   taking an exam (`/exam/[code]` → session → result); the parent dashboard
   (children/progress); the admin panel (users/questions/exams/subjects list+CRUD,
   pagination, filters); subscription/payment screens.
3. Confirm both locales still render (toggle via the language switcher) — a broken
   `StaticText` literal shows the source-language string.

---

## 11. Gotchas / notes

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
  fix, org student-name display, this doc). Committed locally — **not pushed / not merged** per
  the standing instruction (this repo is commit-only for the assistant).
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
| **Payment checkout leads to a 404.** Clicking "Ödənişə keç" redirects to the backend's `return-url` default `http://localhost:3000/payment/return`, a route that does not exist. | This is the **mock** payment provider. Real payment (Payriff) is **vendor-blocked** per backend CLAUDE.md §26. The return URL is a placeholder. | Medium | **Yes** — either hide checkout until real payments land, or add a `/payment/return` page. A real provider changes the return contract, so building the page now may be wasted. |
| **One-shot exam "already completed" UX.** Starting an already-completed one-shot exam silently lands the student on the **read-only submitted session** instead of a clear "you already completed this — here's your result." | Behaviour and data are **correct** (the backend resumes the existing one-shot session). Only the messaging is unpolished. | Low | No (small UX copy/redirect), but confirm the desired message. |
| **Refresh-token double-rotation (watch-item).** Documented in §7. A cross-tab race could theoretically log a user out (per-tab refresh dedupe, not cross-tab). | **Not reproduced through normal usage** — only triggered by manual out-of-band `/auth/refresh` calls during debugging. | Low (watch-only) | No — only investigate if "random logouts" are reported. |
| **No automated frontend test suite.** Verification is manual (§10). | Out of scope for this review; ESLint is also not configured (`npm run lint` prompts interactive setup). | Low | Partially — deciding on a test stack is a project call. |

---

## 15. Future Improvements (documented, NOT current tasks)

Non-essential suggestions for future consideration. **Do not implement these as part of a review
or refactor pass unless explicitly asked.**

- **Shared `useAdminList` hook.** Would remove the remaining list-page state-machine duplication
  (~35 files) and centrally fix a latent **race condition** (rapid filter changes fire
  overlapping fetches with no out-of-order guard — low severity, unobservable on a local
  backend). Only worth doing if it **exactly preserves** each page's debounce/reload timing
  (§8) — otherwise it changes behaviour.
- **Auth redirect timer cleanup.** `SignInInner` / `SignUpInner` / `ResetPasswordInner` set a
  one-shot `setTimeout(() => router.replace(...), ~1s)` after a successful action and don't clear
  it on unmount. Harmless (one-shot, only calls `router.replace`, no setState-after-unmount), but
  a trivial cleanup for zero StrictMode warnings.
- **Countdown-interval churn in `ExamSessionPage`.** The 1-second countdown effect depends on
  `submit` (a `useCallback` that changes when `session` updates), so the interval is torn
  down/recreated whenever the student answers a question. Correct (it recomputes from the real
  `expiresAt`), just slightly wasteful — accessing `submit` via a ref would stabilize it.
- **Splitting `lib/api.js`** by domain (`api/auth.js`, `api/exams.js`, …) if it keeps growing —
  behind the same exported names, no call-site import changes (§5).
- **Student-name secondary UUID.** The org tables show the name + the UUID as small secondary
  text; if the UUID is not needed for support, it can be dropped for a cleaner look (a design
  call, not done).

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
- **`startSession`** (`POST /sessions`) — ad-hoc practice-session start (choose subject/topic/
  difficulty and begin). The seeded practice sessions exist in the DB, but there is no UI to
  create a new one yet; the current UI takes exams by share code only.
- **`redeemOrganizationInvite`** (`POST /organizations/invites/{code}/redeem`) — a student joins
  an org and starts its fixed test by code. No redeem UI yet.
- **`fetchExamDefinitions`** (`GET /exam-definitions`) and **`fetchExamDefinition`**
  (`GET /exam-definitions/{code}`) — official Buraxılış/Qəbul exam blueprints. Not surfaced yet.
- **`regenerateExamShareToken`** (`POST /exams/{id}/share-token/regenerate`) — an exam owner
  rotating a leaked share code. No button wired yet.

**Note:** `fetchLinkedChildren` was previously listed as unimplemented but **IS used** by
`AdminExamFormPage` (a parent assigning an exam to a linked child) — keep it.

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
good); keep the production build green (§10); and keep this file in sync (doc-sync: update the
change log §12 + the relevant section, then summarize in chat).
