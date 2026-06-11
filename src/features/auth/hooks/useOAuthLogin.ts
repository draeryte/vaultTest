import { useMutation } from '@tanstack/react-query'
import { loginWithProvider } from '../api/auth-api'
import { clearLoggedOutMark, toUserProfile } from '../api/session'
import { useAuthStore } from '../stores/auth-store'
import type { OAuthProvider } from '../types'

/** Social login (Google / Apple). On success the profile is written to the auth store. */
export function useOAuthLogin() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: (provider: OAuthProvider) => loginWithProvider(provider),
    onSuccess: (user) => {
      clearLoggedOutMark()
      setSession(toUserProfile(user), user.accessToken)
    },
  })
}
