import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useIsAuthenticated } from '../../features/auth'
import { ROUTES } from './paths'

interface RedirectState {
  from?: { pathname?: string }
}

/**
 * Inverse of ProtectedRoute: keeps an already-authenticated user off guest-only
 * pages (e.g. /login). When login succeeds the auth store flips, this guard
 * re-renders, and the user is sent to wherever they were headed before being
 * bounced to login — or the dashboard by default.
 */
export function GuestRoute() {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (isAuthenticated) {
    const from = (location.state as RedirectState | null)?.from?.pathname
    return <Navigate to={from ?? ROUTES.dashboard} replace />
  }

  return <Outlet />
}
