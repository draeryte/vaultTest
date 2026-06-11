import { create } from 'zustand'
import type { UserProfile } from '../types'

type RestoreStatus = 'idle' | 'restoring' | 'done'

/**
 * Client-side auth state. Server interactions (logging in, refreshing tokens)
 * live in React Query hooks and api/session.ts; this store only holds the
 * logged-in user's profile.
 *
 * Security invariants:
 * - accessToken is an in-memory bearer fallback only; it is never persisted
 *   by the client. The durable credentials are the HttpOnly cookies the
 *   server sets, which JavaScript cannot read.
 * - The refresh token is never retained in JS at all.
 */
interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  /** Progress of the on-load cookie-session restore (see api/session.ts). */
  restoreStatus: RestoreStatus
  setSession: (user: UserProfile, accessToken: string | null) => void
  setAccessToken: (accessToken: string) => void
  setRestoreStatus: (restoreStatus: RestoreStatus) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  restoreStatus: 'idle',
  setSession: (user, accessToken) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setRestoreStatus: (restoreStatus) => set({ restoreStatus }),
  clearSession: () => set({ user: null, accessToken: null }),
}))

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.user !== null)
}
