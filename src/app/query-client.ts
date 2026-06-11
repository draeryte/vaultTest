import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../features/auth/stores/auth-store'
import { ApiError } from '../lib/api/errors'

/**
 * 401 means the session is no longer valid, no matter which request hit it.
 * Wiping the store unmounts the authenticated UI, which is this app's
 * "redirect to the login screen" (there is no router yet).
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
