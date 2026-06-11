import { apiFetch } from '../../../lib/api/client'
import { authFetch } from './session'
import type {
  AuthenticatedUser,
  LoginCredentials,
  OAuthProvider,
  UserProfile,
} from '../types'

/** Access-token lifetime requested from the API, in minutes. */
const SESSION_MINS = 60
const REMEMBERED_SESSION_MINS = 7 * 24 * 60

/**
 * POST /auth/login
 * Body: { username, password, expiresInMins }
 * 200 → AuthenticatedUser | 400 → { message: "Invalid credentials" }
 */
export function login(credentials: LoginCredentials): Promise<AuthenticatedUser> {
  return apiFetch<AuthenticatedUser>('/auth/login', {
    method: 'POST',
    json: {
      username: credentials.username,
      password: credentials.password,
      expiresInMins: credentials.rememberMe
        ? REMEMBERED_SESSION_MINS
        : SESSION_MINS,
    },
  })
}

/**
 * GET /auth/me
 * 200 → current user for the session | 401 → expired or invalid session
 * (The response carries more fields than UserProfile; extras are ignored.)
 * Goes through authFetch, so an expired access token is refreshed and the
 * request retried before a 401 surfaces.
 */
export function getCurrentUser(): Promise<UserProfile> {
  return authFetch<UserProfile>('/auth/me')
}

/* ------------------------------------------------------------------------
 * The endpoints below have no DummyJSON equivalent and remain phase-1 stubs.
 * ---------------------------------------------------------------------- */

const STUB_LATENCY_MS = 900

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * GET /auth/oauth/:provider
 * Real implementation redirects to the provider's consent screen and the
 * session is established on the OAuth callback route.
 */
export async function loginWithProvider(
  provider: OAuthProvider,
): Promise<AuthenticatedUser> {
  await delay(STUB_LATENCY_MS)
  return {
    id: 0,
    username: `demo.${provider}`,
    email: `demo.user@${provider}.example.com`,
    firstName: 'Demo',
    lastName: 'User',
    gender: 'female',
    image: 'https://dummyjson.com/icon/demo/128',
    accessToken: 'stub-access-token',
    refreshToken: 'stub-refresh-token',
  }
}

/**
 * POST /auth/password-reset
 * Body: { email } → 202 accepted (always, to avoid account enumeration)
 */
export async function requestPasswordReset(email: string): Promise<void> {
  void email
  await delay(STUB_LATENCY_MS)
}

/**
 * POST /auth/logout
 * Invalidates the refresh token server-side.
 */
export async function logout(): Promise<void> {
  await delay(STUB_LATENCY_MS / 3)
}
