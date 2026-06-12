# Code Structure

An in-depth walkthrough of how this app is built and how data flows through it.
For day-to-day contributor guidance see [CLAUDE.md](CLAUDE.md); this document
explains the _why_ and traces the runtime behaviour end to end.

---

## 1. What the app is

A responsive web app with two screens:

1. **Login** — built from the Figma mocks, validates locally, authenticates
   against [DummyJSON](https://dummyjson.com).
2. **Dashboard** — the "WebbyFrames" screen you land on after login, showing a
   paginated directory of users.

Stack: **Vite 8 + React 19 + TypeScript**, with **React Router** for
navigation, **React Query** for server state, and **Zustand** for client
state. Styling is plain **CSS Modules** with design tokens. Which screen you
can reach is gated by auth state through route guards (see §4).

---

## 2. The big picture

```
                          ┌──────────────────────────────────────────┐
                          │                main.tsx                  │
                          │   StrictMode → AppProviders → App        │
                          └──────────────────────────────────────────┘
                                            │
                 ┌──────────────────────────┴──────────────────────────┐
                 │                       App.tsx                        │
                 │  useRestoreSession() + useIsAuthenticated() decide:  │
                 │   restoring → "Checking your session…"               │
                 │   authed    → <DashboardPage/>                       │
                 │   else      → <LoginPage/>                           │
                 └──────────────────────────┬──────────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        │                                   │                                   │
   features/auth                       features/dashboard                  shared layers
   ──────────────                      ──────────────────                  ─────────────
   LoginPage / LoginForm               DashboardPage                       lib/api/client  (fetch)
   useLogin / useOAuthLogin            UsersTable / Pagination              lib/api/errors  (typed errors)
   useLogout / useRestoreSession       UsersTableSkeleton                   lib/hooks       (online status)
   api/session  (refresh, restore)     useUsers                            components/*    (feedback, dialog,
   stores/auth-store (Zustand)         api/users-api                                        skeleton)
                                                                            app/query-client (React Query)
```

Everything above the feature line is wiring; everything below is where the work
happens. Two cross-cutting layers (`lib/` and `components/`) are shared by both
features.

---

## 3. Architectural principles

### 3.1 Feature-first folders

Code is grouped by **feature**, not by file type. Each feature
(`src/features/auth`, `src/features/dashboard`) owns its `api/`, `components/`,
`hooks/`, `stores/`, and `types/`, and exposes a **public surface through its
`index.ts` barrel**. Nothing outside a feature reaches into its internals — even
another feature. For example the dashboard imports `authFetch` from
`../../auth` (the barrel), never from `auth/api/session`.

This keeps the blast radius of a change small: as long as the barrel's shape is
stable, a feature's internals can be reorganised freely.

### 3.2 Server state vs client state

A deliberate split:

- **React Query** owns anything that comes from or goes to the server —
  fetching users, the login mutation, token refresh retries. It handles
  caching, retries, pending/error states, and de-duplication.
- **Zustand** owns purely-client state — _who is logged in right now_. The store
  never makes a network call; it just holds the result.

The seam between them: a React Query mutation/query runs, and in its
`onSuccess`/global handler it writes to (or clears) the Zustand store.

### 3.3 One door to the network

Every HTTP call goes through `lib/api/client.ts`: `apiFetch` (the low-level
primitive, for unauthenticated calls only — login/refresh) or `authFetch`
(the default for authenticated endpoints — adds the bearer token and
refresh-on-401). Features import `authFetch` from `lib`, never reaching into
the auth feature; the auth feature connects its token + refresh to the client
via `registerAuthBridge` (called once through `installAuthBridge()` in
`main.tsx`), so `lib` stays feature-agnostic. Nothing calls `fetch` directly —
that single choke point makes cookie credentials, typed errors, offline
detection, and HTTPS enforcement uniform.

---

## 4. App bootstrap, routing & the auth guards

**`main.tsx`** mounts `<App/>` inside `<AppProviders/>` (React Query
`QueryClientProvider`) inside `<RootErrorBoundary/>` inside `<StrictMode>`.

**`App.tsx`** defines the React Router tree. Route components live in
`src/app/routes/` (+ `src/app/layout/`), paths in `routes/paths.ts`. Pages are
lazy-loaded (`React.lazy` + `Suspense`/`RouteFallback`); `LoginPage` stays eager:

```tsx
<BrowserRouter>
  <Route element={<RootLayout/>}>              // restore gate + OfflineBanner
    <Route element={<GuestRoute/>}>            // redirect if already authed
      <Route path="/login" element={<LoginPage/>} />
    </Route>
    <Route element={<ProtectedRoute/>}>        // redirect if NOT authed
      <Route element={<AppLayout/>}>           // authenticated shell + <Outlet/>
        <Route path="/dashboard" element={<Suspense><DashboardPage/></Suspense>} />
        <Route element={<RequireRole roles={['admin']}/>}>   // authorization
          <Route path="/admin" element={<Suspense><AdminPage/></Suspense>} />
        </Route>
      </Route>
    </Route>
    <Route index   element={<Navigate to="/dashboard" replace/>} />
    <Route path="*" element={<Navigate to="/dashboard" replace/>} />
  </Route>
</BrowserRouter>
```

**`RootLayout`** is the layout for every route. It runs the one-time session
restore (`useRestoreSession`) and renders the "Checking your session…" loader
until `restoreStatus === 'done'`, then an `<Outlet/>`. Holding here matters:
the guards below always decide against a *settled* auth state, so a logged-in
user deep-linking or refreshing `/dashboard` isn't briefly bounced to login
while `/auth/me` is in flight. `OfflineBanner` renders above the outlet.

**`ProtectedRoute`** reads `useIsAuthenticated()`; if false it
`<Navigate to="/login" state={{ from: location }} replace/>`, stashing the
attempted location. **`GuestRoute`** is the inverse: an authenticated user on
`/login` is redirected to `from ?? /dashboard`. Together they give the
deep-link round trip — visit `/dashboard` logged out → bounced to `/login` →
after login, sent back to `/dashboard`.

**`AppLayout`** (`src/app/layout/`) is the authenticated **shell**: sidebar
(desktop) / top + bottom bars (mobile) around an `<Outlet/>` where the active
page renders. As a layout route it mounts once and is shared by every protected
page, so a new page is just another `<Route>` inside it — no chrome to
re-implement. Its sidebar nav is route-driven `NavLink`s (active state from the
router), filtered by the user's role; it owns the logout confirmation.

**`RequireRole roles={[...]}`** is the **authorization** guard, nested inside
`ProtectedRoute` (so the user is already authenticated). It checks
`user.role`; a non-matching role redirects to `/dashboard`. The `/admin` route
uses it, and the sidebar hides the Admin link for non-admins — but the guard,
not the hidden link, is what enforces it.

"Navigation" still flows from auth state: logging in sets `store.user`, which
flips `isAuthenticated`, which re-renders `GuestRoute` → redirect to the
dashboard. Logout (and the global 401 handler) clear the store → `ProtectedRoute`
redirects to `/login`. The guards are declarative, so no component calls
`navigate()` imperatively.

> The client guards are UX, not a security boundary — see §7. The real
> protection is that the dashboard's data requires a valid session server-side;
> a forced render would just 401 and bounce back to login.

---

## 5. The shared network & error layer (`src/lib`)

### 5.1 `lib/api/client.ts` — `apiFetch`

The base fetch wrapper. Responsibilities, in order:

1. **Resolve & validate the base URL** at module load from
   `import.meta.env.VITE_API_BASE_URL`. Throws immediately if it's unset, and in
   production builds rejects a base URL that is neither `https://` nor a
   same-origin path (`/...`). This fails the build/boot loudly rather than
   silently talking to the wrong origin.
2. **Offline short-circuit** — if `navigator.onLine` is false, throw
   `NetworkError` before even attempting the request.
3. **Issue the request** with `credentials: 'include'` so the server's
   cookies ride along (see §7), optional `Authorization: Bearer` header, and
   JSON serialisation when a `json` option is passed.
4. **Translate failures into typed errors** — a thrown `fetch` (connection
   died) becomes a `NetworkError`; a non-2xx response becomes an `ApiError`
   carrying the status and parsed body.

```ts
apiFetch<T>(path, { json?, accessToken?, ...RequestInit }): Promise<T>
```

### 5.2 `lib/api/errors.ts` — the error vocabulary

Two error classes and one translation function:

- **`ApiError`** — the server answered with a non-2xx status. Carries
  `status: number` and, for validation responses, `fieldErrors` (a
  `{ field: message }` map parsed from the body's `errors`).
- **`NetworkError`** — the request never reached the server (offline or dropped
  connection).
- **`getUserFacingMessage(error)`** — the **single place** errors become display
  copy. It passes 4xx messages through (they're written for users) but replaces
  **5xx and unknown errors with safe, fixed copy**. This is a security boundary:
  raw server error bodies (stack traces, internal messages) can never reach the
  UI by construction.

### 5.3 `lib/hooks/useOnlineStatus.ts`

A `useSyncExternalStore` subscription to the browser's `online`/`offline`
events. Returns a boolean and re-renders on change. Used by `OfflineBanner`.

### 5.4 `app/query-client.ts` — global React Query policy

Creates the singleton `QueryClient` and bakes in two app-wide rules:

- **Global 401 handling.** Both the `QueryCache` and `MutationCache` `onError`
  run `handleUnauthorized`: any `ApiError` with status 401 clears the auth store
  and drops all cached queries. Because the view gate keys off the store, this
  _is_ the "redirect to login" — no component has to handle 401 itself.
- **Retry policy.** 4xx is never retried (it won't fix itself); 5xx and network
  faults get two more attempts.

---

## 6. The auth feature (`src/features/auth`)

### 6.1 Types (`types/index.ts`)

- **`AuthenticatedUser`** — the `POST /auth/login` response: a thin user summary
  plus `accessToken`/`refreshToken`. Note it has **no `role`**.
- **`UserProfile`** — the `GET /auth/me` shape and the **only** user the client
  stores: the same fields plus `role`, no tokens. Both login and restore resolve
  to this, so a logged-in user always has a role.
- **`UserRole`** — `'admin' | 'moderator' | 'user'` (drives `RequireRole`).
- **`LoginCredentials`** — `{ username, password, rememberMe }`.
- **`RefreshedTokens`** — `{ accessToken, refreshToken }`, the refresh response.

### 6.2 The store (`stores/auth-store.ts`)

A small Zustand store holding the entire client-side auth state:

```ts
{
  user: UserProfile | null            // null = logged out
  accessToken: string | null          // in-memory bearer fallback only
  restoreStatus: 'idle'|'restoring'|'done'
  setSession, setAccessToken, setRestoreStatus, clearSession
}
```

Security invariants encoded here: the `accessToken` is an **in-memory** fallback
(never persisted), and the refresh token is **never** held in JS at all. The
durable credential is the HttpOnly cookie (§7). `useIsAuthenticated()` is a
selector returning `user !== null`.

### 6.3 The login API (`api/auth-api.ts`)

Thin functions over `apiFetch`/`authFetch`, each documenting the endpoint it
maps to:

- **`login(credentials)`** → `POST /auth/login`. Maps `rememberMe` to the API's
  `expiresInMins` (7 days vs 60 min). Returns `AuthenticatedUser` (tokens, but
  **no `role`**).
- **`getCurrentUser()`** → `GET /auth/me` via `authFetch`, returning the
  canonical `UserProfile` (which includes `role`); an expired access token is
  transparently refreshed before a 401 surfaces. Login follows itself with this
  call so the stored profile always has a role.
- **Stubs** — `loginWithProvider` (Google/Apple), `requestPasswordReset`,
  `logout` simulate latency and return canned data. DummyJSON has no equivalent
  endpoints; the signatures are the intended contracts, so swapping the bodies
  for real calls won't touch callers.

### 6.4 Session orchestration (`api/session.ts`) — the heart of auth

This module is where the cross-session / refresh logic lives. (`authFetch`
itself lives in `lib/api/client.ts`; this module supplies it with the token +
refresh via `installAuthBridge()`, called once in `main.tsx`.)

- **`refreshAccessToken()`** — `POST /auth/refresh`, authenticated by the
  HttpOnly refresh cookie (no token sent from JS). It is **single-flight**: a
  module-level `refreshInFlight` promise means many concurrent 401s share _one_
  refresh round trip instead of stampeding the endpoint.

  ```ts
  refreshInFlight ??= requestRefresh().finally(() => { refreshInFlight = null })
  return refreshInFlight
  ```

- **`restoreSession()`** — run once on load. It asks `GET /auth/me` who the
  cookie belongs to and hydrates the store. Because it goes through `authFetch`,
  a returning user whose access cookie expired but whose refresh cookie is still
  valid is silently restored. It is **skipped if the logged-out marker is set**
  and is idempotent (guards on `restoreStatus !== 'idle'`).
- **The logged-out marker** — `markLoggedOut` / `clearLoggedOutMark` /
  `hasLoggedOutMark` toggle a non-sensitive `auth:logged-out` flag in
  `localStorage`. It exists because **JS cannot delete HttpOnly cookies**:
  without it, the next page load's `restoreSession` would silently log a
  logged-out user back in. Login clears the marker; logout sets it.

### 6.5 Hooks (`hooks/`)

- **`useLogin`** — `useMutation` that runs `login` then `getCurrentUser`
  (`/auth/me`) so the stored profile has a `role`. On success: clears the
  logged-out marker and writes the profile + token to the store. Flipping
  `store.user` non-null is what `GuestRoute` reacts to → navigate to dashboard.
- **`useOAuthLogin`** — same pattern over the `loginWithProvider` stub (which
  returns a ready-made `UserProfile`).
- **`useLogout`** — returns a function that clears the session, sets the
  logged-out marker, and drops cached queries. (The real backend's
  `POST /auth/logout` would be called here too.)
- **`useRestoreSession`** — fires `restoreSession()` once on mount and returns
  the live `restoreStatus` so `App` can gate rendering.

### 6.6 Components (`components/`)

- **`AuthLayout`** — the responsive split shell: form left / image panel right on
  desktop, image banner on top / form below on mobile (860px breakpoint).
- **`LoginForm`** — controlled inputs with local validation, password show/hide,
  and a "remember me" checkbox. Submission flow:
  1. `validate()` runs; field errors render under their inputs and block submit.
  2. `login.mutate(...)` fires. On error, a **400/422 with `fieldErrors`** maps
     server messages back under the matching inputs; any other error renders a
     single form-level alert via `getUserFacingMessage`.
  3. While pending the button shows "Logging In…".
- **`SocialLoginButtons`** — Google/Apple buttons wired to `useOAuthLogin`.
- **`LoginPage`** — composes the above inside `AuthLayout`.

---

## 7. The cookie-based session model (security design)

This is the most security-sensitive part of the app, so it's worth stating
plainly.

- **Durable credential = HttpOnly cookies set by the server.** `apiFetch` sends
  `credentials: 'include'`, so those cookies ride along automatically.
  JavaScript never reads or writes them — which is exactly what keeps them out
  of reach of XSS.
- **JS holds the bare minimum.** Only the non-sensitive `UserProfile` plus an
  in-memory `accessToken` fallback. The refresh token is never in JS. Nothing
  sensitive is in `localStorage` (only the logged-out _intent_ flag).
- **Same-origin cookies in dev.** A browser treats `localhost → dummyjson.com`
  as cross-site, so those cookies wouldn't stick. `vite.config.ts` therefore
  **proxies `/api` to DummyJSON** (with `cookieDomainRewrite`) so the cookies
  are first-party in dev — mirroring how the API should be served same-site in
  production. That's why `VITE_API_BASE_URL` is `/api`, not the absolute URL.
- **Backend responsibilities (documented, out of scope for the client).** Cookie
  auth requires CSRF protection on mutating endpoints (SameSite + CSRF token),
  and a real `POST /auth/logout` should clear the cookies server-side.

### Worked example: returning user with an expired access token

```
page load
  └─ useRestoreSession → restoreSession()
       └─ authFetch('/auth/me')
            └─ apiFetch GET /auth/me        → 401 (access cookie expired)
                 └─ refreshAccessToken()
                      └─ POST /auth/refresh  → 200 (refresh cookie valid)  [single-flight]
                 └─ retry apiFetch GET /auth/me (new bearer) → 200 profile
       └─ store.setSession(profile)  → isAuthenticated = true → Dashboard renders
```

If `/auth/refresh` also returns 401, the original 401 bubbles up, the global
handler clears the store, and the user lands on the login form.

---

## 8. The dashboard feature (`src/features/dashboard`)

### 8.1 Types (`types/index.ts`)

- **`DirectoryUser`** — exactly the fields the dashboard consumes (`firstName,
  lastName, age, gender, image, birthDate, height, weight, email, username`).
- **`DirectoryUsersPage`** — the `{ users, total, skip, limit }` envelope.

### 8.2 Data (`api/users-api.ts` + `hooks/useUsers.ts`)

- **`getUsers(page)`** → `GET /users?limit&skip&select` via `authFetch` (so it
  inherits cookie auth + the 401-refresh-retry). `USERS_PAGE_SIZE` is 10 and the
  `select=` param lists only the consumed fields — **data minimisation**, so the
  response never includes sensitive fields like `password`/`ssn`/`bank`.
- **`useUsers(page)`** — `useQuery` keyed `['users', page]`. It sets
  `placeholderData: keepPreviousData`, which is the key to smooth pagination:
  when `page` changes, the previous page's rows stay rendered (and
  `isPlaceholderData` is true) while the next page loads, instead of unmounting
  to a spinner.

### 8.3 The page (`components/DashboardPage.tsx`)

The visual chrome (sidebar, mobile bars) is **not** part of this feature — it
lives in `AppLayout` (§4), and `DashboardPage` renders inside that layout's
`<Outlet/>`. So the page is just its content: the title, the `Tabs` strip (Team
is the active/default tab and scrolls itself into view on mobile), the search
field, and the data region (skeleton / error states / table + pagination). It
holds only `page` state and the users query. `Tabs` are plain `<button>`s with
`aria-current` — deliberately *not* an ARIA `tablist`.

The shell's avatar (in `AppLayout`) reads `store.user.image` — the logged-in
user's own picture, available because login/restore populates the store before
any page mounts.

**Data region rendering logic:**

```tsx
usersQuery.isPending          → <UsersTableSkeleton/>        // first load
usersQuery.isError && 404     → <NotFoundState/>
usersQuery.isError (other)    → <ErrorFallbackCard onRetry={refetch}/>
usersQuery.data               → <div class={isPlaceholderData ? pendingPage}>
                                    <UsersTable key={page}/>
                                  </div>
                                  <Pagination/>   // outside the dim — stays clickable
```

`pageCount` is derived from `total / USERS_PAGE_SIZE`. Only the table is dimmed
during a page change (so pagination stays interactive), and `key={page}`
remounts the table per page so its selection state can't leak across pages.

**Logout** doesn't fire immediately: the sidebar/top-bar buttons set
`confirmingLogout`, which opens the `ConfirmDialog`; confirming calls the
`useLogout` function.

### 8.4 `UsersTable.tsx`

A semantic `<table>` showing `Avatar` + name (email as subtitle), gender, and
birth date. Gender/birth-date are in `.colWide` cells that are `display:none`
below 860px, so mobile shows the author-only list from the mobile mock. It holds
local "selected rows" state (header checkbox toggles all on the page; helpers
format the birth date and capitalise gender); the parent's `key={page}` scopes
that state to the current page.

### 8.5 `Pagination.tsx`

Pure presentational. `getPageItems(page, pageCount)` computes the windowed
`1 … 4 5 6 … 21` layout (always first + last, a window around the current page,
ellipses for gaps). Previous/Next disable at the ends. Labels collapse to just
chevrons on mobile.

### 8.6 Loading skeletons (`UsersTableSkeleton.tsx` + `components/skeleton`)

The "preserve the shape while loading" mechanism:

- **`components/skeleton/Skeleton.tsx`** — a reusable shimmer block (animated
  gradient sweep; respects `prefers-reduced-motion`; sized via
  `width`/`height`/`radius`; `aria-hidden`).
- **`UsersTableSkeleton`** — imports `UsersTable.module.css` **directly**, so its
  wrapper, table, cells, columns, and breakpoint are byte-identical to the real
  table. Only the row _contents_ become shimmer blocks (circular avatar, a
  two-line name/email stack, gender, birth date). Real header labels stay
  because they're static chrome, not data. The result is a placeholder with the
  exact silhouette of the loaded table, including the same mobile column
  collapse.

Two distinct loading affordances:

- **First load** (`isPending`, no cached data) → the skeleton.
- **Page change** (`isPlaceholderData`, previous data retained) → the loaded
  table stays and is dimmed via `.pendingPage` (opacity + `pointer-events:none`)
  rather than flashing the skeleton.

---

## 9. Shared UI components (`src/components`)

Cross-cutting, feature-agnostic UI:

- **`error/RootErrorBoundary`** — class error boundary wrapping the whole app in
  `main.tsx`. Catches **render-time** throws (which React Query's async handling
  can't) and shows a recoverable "Reload" fallback instead of a blank screen.
- **`icon/Icon`** — the single line-icon registry, keyed by a typed `IconName`
  union so a bad name is a compile error. New glyphs are added here rather than
  as inline SVG scattered across components. Size comes from the caller's class.
- **`avatar/Avatar`** — circular image that falls back to the name's initials
  when `src` is missing or fails to load (`onError`), with the failure reset on
  `src` change via the render-time "reset state on prop change" pattern.
- **`feedback/ErrorFallbackCard`** — friendly card with a **Retry** button wired
  to a query's `refetch()`; shown for 5xx/network failures with copy from
  `getUserFacingMessage`.
- **`feedback/NotFoundState`** — purposeful "Item not found" empty state for
  404s.
- **`feedback/OfflineBanner`** — site-wide banner driven by `useOnlineStatus`;
  rendered above the route outlet in `RootLayout`, so it shows on every screen.
- **`dialog/ConfirmDialog`** — reusable modal built on the **native `<dialog>`**
  element (free focus trap, Escape handling, backdrop). Driven by an `open` prop
  via `showModal()`/`close()`; cancels on backdrop click, Escape, or Cancel.
  Currently used for the logout confirmation.
- **`skeleton/Skeleton`** — the shimmer primitive described in §8.6.

---

## 10. Styling system

- **CSS Modules** (`*.module.css`) co-located with each component; class names
  are locally scoped, so there's no global-CSS collision risk.
- **Design tokens** are CSS custom properties in `src/index.css`
  (`--color-primary`, `--color-heading`, `--color-border`, etc.). Components
  reference the variables instead of hardcoding hex values.
- **One responsive breakpoint: 860px.** Above it, layouts are the desktop
  variants (auth split, dashboard sidebar, full table); below, the mobile
  variants (stacked auth, top/bottom bars, author-only list). The breakpoint is
  duplicated across the relevant component CSS modules, so it must be kept
  consistent when touched.
- **Shape-matching trick**: when a component needs a placeholder/variant with an
  identical silhouette (like the table skeleton), it imports the original's CSS
  module rather than re-deriving the layout.

---

## 11. Configuration & build

- **`VITE_API_BASE_URL`** (`.env`, typed in `src/vite-env.d.ts`) is the API
  origin. In dev it's `/api`, proxied to DummyJSON by `vite.config.ts` so auth
  cookies are first-party. `VITE_*` values are embedded in the public bundle —
  **never put secrets there** (documented in `.env`/`.env.example`).
- **`vite.config.ts`** — React plugin + the `/api` dev proxy
  (`changeOrigin`, path rewrite, `cookieDomainRewrite`).
- **Commands**: `npm run dev` (port 5173), `npm run build` (`tsc -b && vite
  build` — also the typecheck), `npm run lint`, `npm run preview`, `npm test`
  (Vitest, jsdom) / `npm run test:watch`.
- **Tests** (`*.test.ts` beside the code) cover the riskiest pure/async logic —
  error translation (`lib/api/errors`), session refresh/restore/single-flight
  (`features/auth/api/session`), pagination windowing, and request URLs — not
  components. `src/test/setup.ts` provides an in-memory `localStorage`; the API
  base URL is injected via `test.env` in `vite.config.ts`. Changes are also
  verified with build + lint + manual browser checks.

---

## 12. End-to-end traces

**Fresh login → dashboard**

```
LoginForm submit
  → validate() ok
  → useLogin.mutate({username,password,rememberMe})
       → login() → apiFetch POST /auth/login → 200 AuthenticatedUser
       → onSuccess: clearLoggedOutMark(); store.setSession(profile, accessToken)
  → store.user non-null → GuestRoute redirects to /dashboard → DashboardPage
       → useUsers(1) → authFetch GET /users?... → 200 page
       → UsersTable renders; chrome avatar = store.user.image
```

**Wrong password**

```
useLogin.mutate → apiFetch POST /auth/login → 400 ApiError("Invalid credentials")
  → no fieldErrors → LoginForm shows one form-level alert (getUserFacingMessage
    passes the 4xx message through)
```

**Logout**

```
Sidebar "Log Out" → setConfirmingLogout(true) → <ConfirmDialog open>
  confirm → useLogout(): store.clearSession(); markLoggedOut(); removeQueries()
         → store.user null → ProtectedRoute redirects to /login → LoginPage
```

**Server outage while viewing the dashboard**

```
useUsers refetch → apiFetch GET /users → 500 ApiError
  → retry policy: two more tries (5xx) → still 500
  → DashboardPage shows <ErrorFallbackCard message=SERVER_ERROR_MESSAGE
    onRetry={refetch}>   (raw 5xx body never shown)
```
