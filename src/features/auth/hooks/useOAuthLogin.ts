import { useMutation } from '@tanstack/react-query'
import { loginWithProvider } from '../api/auth-api'
import { useAuthStore } from '../stores/auth-store'
import type { OAuthProvider } from '../types'

/** Social login (Google / Apple). On success the user is written to the auth store. */
export function useOAuthLogin() {
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: (provider: OAuthProvider) => loginWithProvider(provider),
    onSuccess: (user) => setUser(user),
  })
}
