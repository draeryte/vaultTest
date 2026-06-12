import { useMutation } from '@tanstack/react-query'
import { getCurrentUser, login } from '../api/auth-api'
import { clearLoggedOutMark } from '../api/session'
import { useAuthStore } from '../stores/auth-store'
import type { LoginCredentials } from '../types'

/**
 * Username/email + password login. The login response has no `role`, so we
 * follow it with /auth/me to get the canonical profile (with role) — the same
 * shape session-restore produces. On success the profile is written to the
 * store; the server's HttpOnly cookies carry the durable credentials.
 */
export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const auth = await login(credentials)
      // Make the token available so getCurrentUser's authFetch can send it.
      useAuthStore.getState().setAccessToken(auth.accessToken)
      return getCurrentUser()
    },
    onSuccess: (profile) => {
      clearLoggedOutMark()
      setSession(profile, useAuthStore.getState().accessToken)
    },
  })
}
