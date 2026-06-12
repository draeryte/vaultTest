# VaultTest — Auth Flow

A responsive login/auth flow and authenticated dashboard, built as a take-home.
A user signs in against the [DummyJSON](https://dummyjson.com) auth API, the
session persists across reloads via HttpOnly cookies, and the dashboard shows a
paginated user directory behind protected, role-aware routes.

## Tech stack

| Concern | Choice |
| --- | --- |
| Build tool | **Vite 8** |
| UI | **React 19** + **TypeScript** |
| Routing | **React Router 7** |
| Server state | **TanStack Query (React Query)** |
| Client state | **Zustand** |
| Styling | **CSS Modules** + design tokens (`src/index.css`) |
| Tests | **Vitest** (jsdom) + **React Testing Library** |

**Architecture in one paragraph:** code is grouped **feature-first**
(`src/features/{auth,dashboard,admin}`), each feature exposing a public API
through its `index.ts` barrel. Cross-cutting code lives in `src/lib` (the API
client + typed errors), `src/app` (routing and the authenticated layout), and
`src/components` (shared UI). Server interactions go through React Query;
the resulting auth state lives in a small Zustand store. Every HTTP call goes
through one client (`authFetch`/`apiFetch`) so cookie credentials, token
refresh, typed errors, and offline handling are uniform. For the full picture
see [`codeStructure.md`](./codeStructure.md); for working conventions see
[`CLAUDE.md`](./CLAUDE.md).

## Requirements

- **Node.js 20.19+ or 22.12+** (required by Vite 8)
- **npm** (project uses `package-lock.json`)

Check your version with `node -v`.

## Installation

```bash
git clone <repo-url>
cd vaultTest
npm install
```

## Running the app

```bash
npm run dev      # start the Vite dev server at http://localhost:5173
```

Open http://localhost:5173 and log in with the DummyJSON test account:

> **Username:** `emilys`  **Password:** `emilyspass`

(The field is labelled "Username" because DummyJSON authenticates by username,
not email.) `emilys` has the `admin` role, so the **Admin** nav item and
`/admin` route are visible after login.

```bash
npm run build    # type-check (tsc -b) + production build into dist/
npm run preview  # serve the production build locally
```

## Environment & API configuration

The API origin comes from `VITE_API_BASE_URL`, defined in `.env` (committed) and
typed in `src/vite-env.d.ts`. Copy the example if you need a local override:

```bash
cp .env.example .env.local   # .env.local is gitignored; overrides .env
```

```ini
# .env
VITE_API_BASE_URL=/api
```

In development, `/api` is **proxied to `https://dummyjson.com`** by
`vite.config.ts` (with `cookieDomainRewrite`) so the server's HttpOnly auth
cookies are first-party. Production should point `VITE_API_BASE_URL` at a
same-site HTTPS origin (or keep a same-origin `/api` path behind the domain) —
the API client refuses a non-HTTPS absolute URL in production builds.

> `VITE_*` values are embedded in the public JS bundle. **Never put secrets in
> them.** The durable credentials are the server's HttpOnly cookies, which
> JavaScript never reads or writes.

## Testing & scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (port 5173) with HMR |
| `npm run build` | `tsc -b && vite build` — this is also the **type-check** (no separate `typecheck` script) |
| `npm run lint` | ESLint over the repo |
| `npm run preview` | Serve the production build from `dist/` |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |

Tests are colocated with the code as `*.test.ts(x)` and run in jsdom. Coverage
focuses on the riskiest pure/async logic and the auth flow — error translation,
the `login` request and the login hook's `login → /auth/me` sequence, session
refresh/restore (single-flight), pagination windowing, and the route guards —
rather than broad component snapshots. `src/test/setup.ts` provides an in-memory
`localStorage`, and the API base URL is injected via `test.env` in
`vite.config.ts`.

Run a single file or test by name:

```bash
npm test -- src/features/auth/api/auth-api.test.ts   # one file
npm test -- -t "login"                               # tests matching a name
```

## Project structure

```
src/
├─ main.tsx                 # entry: error boundary, providers, installAuthBridge()
├─ App.tsx                  # React Router tree (guards, layout, lazy pages)
├─ index.css                # design tokens + base styles
├─ app/                     # app-level wiring (not feature-specific)
│  ├─ providers.tsx         # QueryClientProvider
│  ├─ query-client.ts       # QueryClient: global 401 handler + retry policy
│  ├─ layout/AppLayout.tsx  # authenticated shell (sidebar + mobile bars + <Outlet/>)
│  └─ routes/               # RootLayout, ProtectedRoute, GuestRoute,
│                           #   RequireRole, RouteFallback, paths.ts
├─ features/
│  ├─ auth/                 # login, session restore/refresh, store, types
│  ├─ dashboard/            # user-directory page: table, pagination, tabs
│  └─ admin/                # admin-only page
├─ lib/
│  ├─ api/                  # client (apiFetch/authFetch) + typed errors
│  └─ hooks/                # useOnlineStatus
├─ components/              # shared UI: icon, avatar, search, dialog,
│                           #   skeleton, feedback states, error boundary
└─ test/setup.ts           # Vitest setup (localStorage polyfill)
```

Each feature follows the same shape (`api/`, `components/`, `hooks/`,
`stores/`, `types/` as needed) and is imported only via its `index.ts` barrel.
