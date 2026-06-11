import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '../api/auth-api'
import { useAuthStore } from '../stores/auth-store'

/**
 * Profile of the logged-in user, fetched with the stored access token.
 * Disabled while logged out; a 401 is handled globally (see query-client.ts)
 * by wiping the auth store, which returns the user to the login screen.
 */
export function useCurrentUser() {
  const accessToken = useAuthStore((state) => state.user?.accessToken)
  const username = useAuthStore((state) => state.user?.username)

  return useQuery({
    queryKey: ['auth', 'me', username],
    queryFn: () => {
      if (!accessToken) throw new Error('No access token in store')
      return getCurrentUser(accessToken)
    },
    enabled: Boolean(accessToken),
  })
}
