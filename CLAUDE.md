# CLAUDE.md — testaz Frontend

> Architecture & convention memory for the **testaz** frontend (this repo, `eduall/`).
> Any Claude instance working here should read this file first. It is the single
> source of truth for how the frontend is built, the rules that must not be broken,
> and where things live. It mirrors the role that `backend/CLAUDE.md` plays for the API.
>
> Keep this file in sync when you change architecture, folder structure, state
> management, the API layer, the i18n system, or shared conventions.

---

## 1. What this is

The web client for **testaz** — a test/quiz platform for Azerbaijani 11th-grade
students preparing for the Buraxılış (graduation) and Qəbul (university-entrance)
exams. It talks to the Spring Boot backend documented in `openapi.yaml` /
`docs/API_DOCUMENTATION.md`.

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

- **Code-quality refactor pass.** No behavior/visual change. Extracted `AdminPagination`
  (de-duplicated the identical pager footer across 10 admin list pages); consolidated
  `normalizeRole` (removed the duplicate in `api.js`, imported from `authRoles.js`) and
  removed the unused `emptyPage`; deleted dead files (`components/InstructorOne.jsx`,
  `helper/Preloader.jsx`); fixed the stale `ProtectedRoute` reference in `README.md`;
  created this `CLAUDE.md`. Build verified green (49 routes, identical route set).
