import { useMutation } from '@tanstack/react-query'
import { login } from '../api/auth-api'
import { useAuthStore } from '../stores/auth-store'
import type { LoginCredentials } from '../types'

/** Username/email + password login. On success the user is written to the auth store. */
export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (user) => setUser(user),
  })
}
