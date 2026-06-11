import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useIsAuthenticated } from '../../features/auth'
import { ROUTES } from './paths'

/**
 * Gates its child routes behind authentication. An unauthenticated visitor is
 * sent to /login, with the attempted location stashed in router state so login
 * can return them there (deep-link round trip). Session restore is already
 * settled by RootLayout, so `isAuthenticated` here is trustworthy.
 *
 * This also covers the global 401 / logout paths: clearing the auth store flips
 * `isAuthenticated`, which re-renders this guard and redirects to /login.
 */
export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />
  }

  return <Outlet />
}
