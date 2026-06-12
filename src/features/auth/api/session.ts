import {
  apiFetch,
  authFetch,
  registerAuthBridge,
} from '../../../lib/api/client'
import { useAuthStore } from '../stores/auth-store'
import type { RefreshedTokens, UserProfile } from '../types'

/**
 * Session orchestration: token refresh, restoring a session from the server's
 * HttpOnly cookies on page load, and bridging the shared API client to this
 * feature's token + refresh.
 */

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
 * Wires the shared API client (`authFetch`) to this feature's access token and
 * refresh routine. Call once at startup, before anything makes a request.
 */
export function installAuthBridge(): void {
  registerAuthBridge({
    getAccessToken: () => useAuthStore.getState().accessToken ?? undefined,
    refresh: refreshAccessToken,
  })
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
