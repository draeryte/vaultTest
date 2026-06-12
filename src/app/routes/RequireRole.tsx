import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../features/auth'
import type { UserRole } from '../../features/auth'
import { ROUTES } from './paths'

/**
 * Authorization guard: gates child routes behind one of the allowed roles.
 * Nests inside ProtectedRoute, so the user is already authenticated here — this
 * only checks *what* they're allowed to see. A user without a matching role is
 * sent back to the dashboard. (Client-side gating is UX; the server must still
 * enforce authorization on the data.)
 */
export function RequireRole({ roles }: { roles: UserRole[] }) {
  const role = useAuthStore((state) => state.user?.role)

  if (!role || !roles.includes(role)) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return <Outlet />
}
