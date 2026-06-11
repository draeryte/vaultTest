import { apiFetch } from '../../../lib/api/client'
import type { ApiFetchOptions } from '../../../lib/api/client'
import { ApiError } from '../../../lib/api/errors'
import { useAuthStore } from '../stores/auth-store'
import type { AuthenticatedUser, RefreshedTokens, UserProfile } from '../types'

/**
 * Session orchestration: token refresh, authenticated requests, and restoring
 * a session from the server's HttpOnly cookies on page load.
 */

/** Strips tokens so they never enter client state. */
export function toUserProfile(user: AuthenticatedUser): UserProfile {
  const { accessToken, refreshToken, ...profile } = user
  void accessToken
  void refreshToken
  return profile
}

/*
 * Explicit-logout marker. JavaScript cannot delete the server's HttpOnly
 * cookies, so without this a user who logs out would be silently logged back
 * in by the next page load's session restore. The flag holds no sensitive
 * data — it only records intent.
 */
const LOGGED_OUT_KEY = 'auth:logged-out'

export function markLoggedOut(): void {
  try {
    localStorage.setItem(LOGGED_OUT_KEY, '1')
  } catch {
    // Storage unavailable (private mode) — restore will still require cookies.
  }
}

export function clearLoggedOutMark(): void {
  try {
    localStorage.removeItem(LOGGED_OUT_KEY)
  } catch {
    // Ignore: worst case the marker lingers and the user logs in manually.
  }
}

function hasLoggedOutMark(): boolean {
  try {
    return localStorage.getItem(LOGGED_OUT_KEY) === '1'
  } catch {
    return false
  }
}

let refreshInFlight: Promise<string | null> | null = null

/**
 * POST /auth/refresh
 * The HttpOnly refresh cookie authenticates the call; no token is sent from
 * JS. Single-flight: concurrent 401s share one refresh round trip. Resolves
 * to the new access token, or null when the session cannot be renewed.
 */
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= requestRefresh().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

async function requestRefresh(): Promise<string | null> {
  try {
    const tokens = await apiFetch<RefreshedTokens>('/auth/refresh', {
      method: 'POST',
      json: {},
    })
    useAuthStore.getState().setAccessToken(tokens.accessToken)
    return tokens.accessToken
  } catch {
    return null
  }
}

/**
 * apiFetch for endpoints that require auth: attaches the in-memory bearer
 * token when present (cookies ride along regardless), and on a 401 refreshes
 * the session once and retries. If the refresh fails the original 401
 * propagates, which the global handler turns into a logout.
 */
export async function authFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken ?? undefined
  try {
    return await apiFetch<T>(path, { ...options, accessToken })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const renewed = await refreshAccessToken()
      if (renewed) {
        return apiFetch<T>(path, { ...options, accessToken: renewed })
      }
    }
    throw error
  }
}

/**
 * On-load session restore: asks the server who the cookie belongs to.
 * An expired access cookie is handled by authFetch's refresh-and-retry, so
 * a returning user with only a live refresh token still gets restored.
 * Skipped when the user explicitly logged out. Safe to call more than once.
 */
export async function restoreSession(): Promise<void> {
  const store = useAuthStore.getState()
  if (store.restoreStatus !== 'idle') return
  store.setRestoreStatus('restoring')

  try {
    if (hasLoggedOutMark()) return
    const profile = await authFetch<UserProfile>('/auth/me')
    useAuthStore
      .getState()
      .setSession(profile, useAuthStore.getState().accessToken)
  } catch {
    // No valid cookie session (or offline) — stay signed out.
  } finally {
    useAuthStore.getState().setRestoreStatus('done')
  }
}
