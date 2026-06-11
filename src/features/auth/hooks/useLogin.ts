import { useMutation } from '@tanstack/react-query'
import { login } from '../api/auth-api'
import { clearLoggedOutMark, toUserProfile } from '../api/session'
import { useAuthStore } from '../stores/auth-store'
import type { LoginCredentials } from '../types'

/**
 * Username/email + password login. On success the profile (tokens stripped)
 * is written to the auth store; the server's HttpOnly cookies carry the
 * durable credentials.
 */
export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (user) => {
      clearLoggedOutMark()
      setSession(toUserProfile(user), user.accessToken)
    },
  })
}
