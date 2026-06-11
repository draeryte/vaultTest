import { create } from 'zustand'
import type { AuthenticatedUser } from '../types'

/**
 * Client-side auth state. Server interactions (logging in, refreshing tokens)
 * live in React Query hooks; this store only holds the logged-in user.
 */
interface AuthState {
  user: AuthenticatedUser | null
  setUser: (user: AuthenticatedUser) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.user !== null)
}
