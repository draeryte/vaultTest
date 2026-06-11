import { useEffect } from 'react'
import { restoreSession } from '../api/session'
import { useAuthStore } from '../stores/auth-store'

/**
 * Kicks off the one-time cookie-session restore on mount and reports its
 * progress so the app can hold rendering until the session is known.
 */
export function useRestoreSession() {
  const restoreStatus = useAuthStore((state) => state.restoreStatus)

  useEffect(() => {
    void restoreSession()
  }, [])

  return restoreStatus
}
