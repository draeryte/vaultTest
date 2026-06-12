# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A take-home test: a responsive login/auth flow built with Vite + React 19 + TypeScript. The UI must match the design mocks in `reference/` (`Login - 2.png` for desktop, `Mobile - Login - 2.png` for mobile).

## Commands

- `npm run dev` — Vite dev server on port 5173 (also defined as the `dev` server in `.claude/launch.json` for preview tools)
- `npm run build` — `tsc -b && vite build`; this is also the typecheck (there is no separate typecheck script)
- `npm run lint` — ESLint over the repo
- `npm run preview` — serve the production build
- `npm test` — Vitest (jsdom) once; `npm run test:watch` for watch mode

Tests use Vitest with an in-memory `localStorage` polyfill in `src/test/setup.ts`; the API base URL is injected via `test.env` in `vite.config.ts`. Coverage focuses on the riskiest pure/async logic (error translation, session refresh/restore, pagination windowing, request URLs) — not components.

## Architecture

**Feature-first layout.** Features live in `src/features/` (`auth/`, `dashboard/`, `admin/`), each split into `api/`, `components/`, `hooks/`, `stores/`, `types/` as needed. Each feature exposes a public surface via its `index.ts` barrel — code outside the feature imports only from the barrel, never from internal paths. Cross-cutting code lives outside features: `src/lib/` (API client, typed errors, generic hooks), `src/app/` (routing + the authenticated `layout/AppLayout`), and `src/components/` (shared UI). Shared components: `icon/Icon` (typed `IconName` union — add new glyphs here, not as inline SVG), `avatar/Avatar` (circular image with initials fallback on missing/broken `src`), `search/SearchField`, `dialog/ConfirmDialog`, `skeleton/Skeleton`, the `feedback/` states, and `error/RootErrorBoundary` (wraps the app in `main.tsx` to catch render-time throws — React Query handles async errors separately). Features depend on `lib`/`components`/`app`, not on each other (the dashboard/admin features read auth state via the `auth` barrel, which is the one foundational exception).

**Routing.** `react-router-dom` drives navigation (`src/App.tsx` defines the tree; route components in `src/app/routes/`, paths in `routes/paths.ts`). Layering of route elements:
- `RootLayout` runs the one-time session restore and holds rendering (the "Checking your session…" loader) until it settles, so guards decide against a stable auth state.
- `GuestRoute` (wraps `/login`) redirects authenticated users away; `ProtectedRoute` redirects unauthenticated users to `/login`, stashing the attempted location so login round-trips back. Both just read `useIsAuthenticated()`.
- `AppLayout` (`src/app/layout/`) is the authenticated **shell** — sidebar + mobile bars + an `<Outlet/>`, mounted once and shared by every protected page (new pages render in the outlet, not re-implementing chrome). Its sidebar nav is route-driven `NavLink`s, role-filtered. It owns the logout confirmation.
- `RequireRole roles={[...]}` (e.g. `/admin`) gates by `user.role` (authorization). Non-matching roles redirect to `/dashboard`.

Pages are **lazy-loaded** (`React.lazy` + `Suspense` with `RouteFallback`) so a logged-out user never downloads authenticated pages and each page is its own chunk; `LoginPage` stays eager. Logout and the global 401 handler clear the store, which makes the guards redirect declaratively — no imperative navigation.

**Dashboard.** `features/dashboard` renders the dashboard page content (title, tabs, search, table) *inside* `AppLayout`'s outlet — the shell/chrome is no longer part of this feature. The 860px breakpoint splits desktop/mobile (the shell's sidebar vs. top/bottom bars). The user directory comes from `GET /users` via `useUsers(page)` with `limit`/`skip` pagination (10 per page) and a `select=` param that fetches only the fields in `DirectoryUser`. The shell's circular avatar (`AppLayout`) is the logged-in user's `image`. The table shows first/last name, email (subtitle), gender, and birth date; gender/birth-date columns collapse on mobile. `UsersTable` carries `key={page}` so its row-selection state resets per page rather than leaking across pages. Tabs are plain buttons with `aria-current` (not an ARIA tablist) since they're presentational in phase 1.

**Loading states.** `src/components/skeleton/Skeleton.tsx` is the shimmer primitive. `UsersTableSkeleton` imports `UsersTable.module.css` directly so its cells/columns/breakpoints are byte-identical to the real table — only row contents become shimmer blocks, preserving the layout's shape on first load. On page changes, `useUsers` uses `keepPreviousData`, so the previous page stays rendered and is dimmed (`DashboardPage.module.css` `.pendingPage`) instead of flashing the skeleton. Reuse `Skeleton` (mirroring the real markup's CSS module) for future loading placeholders.

**State management split.** Server state goes through React Query (mutations in `hooks/useLogin.ts`, `hooks/useOAuthLogin.ts`); client state lives in Zustand (`stores/auth-store.ts`, which holds only `user: AuthenticatedUser | null`). The store never makes network calls; hooks write to it in `onSuccess`. The `QueryClientProvider` is set up in `src/app/providers.tsx`.

**Login data flow.** `LoginForm` validates locally → `useLogin` mutation → `login()` POSTs to `/auth/login` (returns tokens but **no `role`**) → the mutation then calls `GET /auth/me` for the canonical `UserProfile` (which includes `role`) → it's written to the Zustand store. Session-restore resolves to the same `/auth/me` shape, so a logged-in user always has a role. API errors throw with the server's `message`, which the form renders in its `role="alert"` error. `UserRole` is `'admin' | 'moderator' | 'user'`.

**Configuration.** The API base URL comes from `VITE_API_BASE_URL` (`.env`, typed in `src/vite-env.d.ts`). In dev it is `/api`, proxied to DummyJSON by `vite.config.ts` so the auth cookies are first-party; production should point at a same-site https origin or path. `apiFetch` fails fast if the variable is missing and rejects non-https absolute URLs in production builds. VITE_* values are embedded in the public bundle — never put secrets in them.

**Session persistence & refresh** (`src/features/auth/api/session.ts`). The durable credentials are the server-set HttpOnly cookies; JavaScript never reads or writes them (`apiFetch` sends `credentials: 'include'`). The Zustand store keeps only the profile plus an in-memory bearer-token fallback — the refresh token is never retained in JS. The moving parts:

- `authFetch` (`src/lib/api/client.ts`) — the default client for authenticated endpoints; features import it from `lib`, never reaching into the auth feature, and should use it rather than `apiFetch` (which is for unauthenticated calls only: login/refresh). On a 401 it calls the registered bridge's `refresh` (single-flight `POST /auth/refresh`, cookie-authenticated) and retries once; if refresh fails the original 401 propagates to the global logout handler. The auth feature wires the bridge (token accessor + refresh) via `installAuthBridge()`, called once in `main.tsx` — this keeps `lib` from depending on a feature.
- `restoreSession` — called once on app load via `useRestoreSession` (App gates rendering on `restoreStatus`): asks `GET /auth/me` who the cookie belongs to and hydrates the store, so sessions survive reloads without any token in JS.
- Logout sets a non-sensitive `auth:logged-out` localStorage marker (cleared on the next login) because JS cannot delete HttpOnly cookies; restore skips itself when the marker is set. The real backend's `POST /auth/logout` should clear the cookies server-side.
- Cookie auth means the real backend must add CSRF protection on mutating endpoints (SameSite + CSRF token); noted in `client.ts`.

**DummyJSON quirk.** The API authenticates by *username* (test credentials: `emilys` / `emilyspass`), but the design labels the field "Email Address". The form keeps the design label, sends the value as `username`, and validation accepts bare usernames while rejecting malformed email-shaped input. `rememberMe` maps to the API's `expiresInMins` (7 days vs 60 minutes).

**Error handling.** All HTTP goes through `apiFetch` in `src/lib/api/client.ts`, which throws typed errors from `src/lib/api/errors.ts`: `NetworkError` (offline / connection failure) and `ApiError` (carries `status` and, for 400/422, `fieldErrors` keyed by form field name). Display copy always comes from `getUserFacingMessage` — it passes 4xx messages through but replaces 5xx and unknown errors with safe copy, so raw server errors never reach the UI. Per-status flows:

- **401** — handled globally in `src/app/query-client.ts` via `QueryCache`/`MutationCache` `onError`: the auth store is wiped, which flips `isAuthenticated` so `ProtectedRoute` redirects to `/login`. Components never handle 401 themselves.
- **400/422** — `LoginForm` maps `ApiError.fieldErrors` under the matching inputs and suppresses the form-level alert when it does.
- **404** — render `NotFoundState` (`src/components/feedback/`) instead of a broken page.
- **5xx / network failure** — render `ErrorFallbackCard` with `getUserFacingMessage` and wire `onRetry` to the query's `refetch()`.
- **Offline** — `OfflineBanner` (driven by `useOnlineStatus`) shows site-wide; `apiFetch` also fails fast with `NetworkError` when `navigator.onLine` is false.

The retry policy in `query-client.ts` never retries 4xx and gives 5xx/network errors two retries. The dashboard's users query (`features/dashboard/hooks/useUsers.ts`) is the reference implementation of these query error states.

**Stubs.** `loginWithProvider` (Google/Apple), `requestPasswordReset`, and `logout` in `auth-api.ts` are latency-simulating stubs — DummyJSON has no equivalent endpoints. Their signatures are the intended contracts; swap bodies for real calls without changing callers. Routing does not exist yet; the authenticated view in `LoginPage` is a stand-in, and the Forgot Password / Sign Up links are `TODO(phase 2)` placeholders.

## Styling

Plain CSS modules (`*.module.css`) co-located with each component. Design tokens (colors, font stack) are CSS custom properties in `src/index.css` — use the `--color-*` variables, don't hardcode hex values. The responsive breakpoint is **860px**: above it the layout is a 50/50 split (form left, image panel right, social buttons side by side); below it the image becomes a top banner and buttons stack full-width. Layout media queries live in the component CSS modules, so keep the breakpoint consistent across them.
