import { useQueryClient } from '@tanstack/react-query'
import { markLoggedOut } from '../api/session'
import { useAuthStore } from '../stores/auth-store'

/**
 * Client-side logout: clears the session, records the logged-out intent
 * (JS cannot delete the HttpOnly cookies), and drops cached queries so the
 * next login starts fresh. The real backend's POST /auth/logout should also
 * be called here once it exists, to clear the cookies server-side.
 */
export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)
  const queryClient = useQueryClient()

  return () => {
    clearSession()
    markLoggedOut()
    queryClient.removeQueries()
  }
}
