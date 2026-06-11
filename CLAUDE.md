# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A take-home test: a responsive login/auth flow built with Vite + React 19 + TypeScript. The UI must match the design mocks in `reference/` (`Login - 2.png` for desktop, `Mobile - Login - 2.png` for mobile).

## Commands

- `npm run dev` — Vite dev server on port 5173 (also defined as the `dev` server in `.claude/launch.json` for preview tools)
- `npm run build` — `tsc -b && vite build`; this is also the typecheck (there is no separate typecheck script)
- `npm run lint` — ESLint over the repo
- `npm run preview` — serve the production build

There is no test runner configured.

## Architecture

**Feature-first layout.** Auth code lives in `src/features/auth/` split into `api/`, `components/`, `hooks/`, `stores/`, `types/`. Each feature exposes a public surface via its `index.ts` barrel — code outside the feature (e.g. `src/App.tsx`) imports only from the barrel, never from internal paths.

**State management split.** Server state goes through React Query (mutations in `hooks/useLogin.ts`, `hooks/useOAuthLogin.ts`); client state lives in Zustand (`stores/auth-store.ts`, which holds only `user: AuthenticatedUser | null`). The store never makes network calls; hooks write to it in `onSuccess`. The `QueryClientProvider` is set up in `src/app/providers.tsx`.

**Login data flow.** `LoginForm` validates locally → `useLogin` mutation → `api/auth-api.ts login()` POSTs to `https://dummyjson.com/auth/login` → on success the response (typed as `AuthenticatedUser`, a one-to-one mirror of the DummyJSON response) is written to the Zustand store → `LoginPage` switches from the form to the authenticated view. API errors throw with the server's `message`, which the form renders in its `role="alert"` error.

**DummyJSON quirk.** The API authenticates by *username* (test credentials: `emilys` / `emilyspass`), but the design labels the field "Email Address". The form keeps the design label, sends the value as `username`, and validation accepts bare usernames while rejecting malformed email-shaped input. `rememberMe` maps to the API's `expiresInMins` (7 days vs 60 minutes).

**Stubs.** `loginWithProvider` (Google/Apple), `requestPasswordReset`, and `logout` in `auth-api.ts` are latency-simulating stubs — DummyJSON has no equivalent endpoints. Their signatures are the intended contracts; swap bodies for real calls without changing callers. Routing does not exist yet; the authenticated view in `LoginPage` is a stand-in, and the Forgot Password / Sign Up links are `TODO(phase 2)` placeholders.

## Styling

Plain CSS modules (`*.module.css`) co-located with each component. Design tokens (colors, font stack) are CSS custom properties in `src/index.css` — use the `--color-*` variables, don't hardcode hex values. The responsive breakpoint is **860px**: above it the layout is a 50/50 split (form left, image panel right, social buttons side by side); below it the image becomes a top banner and buttons stack full-width. Layout media queries live in the component CSS modules, so keep the breakpoint consistent across them.
