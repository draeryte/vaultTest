import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../features/auth/stores/auth-store'
import { ApiError } from '../lib/api/errors'

/**
 * 401 means the session is no longer valid, no matter which request hit it.
 * Wiping the store flips `isAuthenticated`, which makes ProtectedRoute redirect
 * to /login — so any 401 anywhere lands the user back on the login screen.
 */
function handleUnauthorized(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    useAuthStore.getState().clearSession()
    queryClient.removeQueries()
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // 4xx won't fix itself by retrying; give 5xx/network faults two more tries.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false
        return failureCount < 2
      },
    },
  },
})
