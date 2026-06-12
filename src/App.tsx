import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './features/auth'
import { AppLayout } from './app/layout/AppLayout'
import { GuestRoute } from './app/routes/GuestRoute'
import { ProtectedRoute } from './app/routes/ProtectedRoute'
import { RequireRole } from './app/routes/RequireRole'
import { RootLayout } from './app/routes/RootLayout'
import { RouteFallback } from './app/routes/RouteFallback'
import { ROUTES } from './app/routes/paths'

// Authenticated pages are code-split: a logged-out user never downloads them,
// and each page is its own chunk. Login stays eager (it's the cold-start page).
const DashboardPage = lazy(() =>
  import('./features/dashboard/components/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  })),
)
const AdminPage = lazy(() =>
  import('./features/admin').then((m) => ({ default: m.AdminPage })),
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {/* Guest-only: an authenticated user is redirected away. */}
          <Route element={<GuestRoute />}>
            <Route path={ROUTES.login} element={<LoginPage />} />
          </Route>

          {/* Protected: unauthenticated users are sent to /login. */}
          <Route element={<ProtectedRoute />}>
            {/* Authenticated shell — every page renders inside its <Outlet/>. */}
            <Route element={<AppLayout />}>
              <Route
                path={ROUTES.dashboard}
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <DashboardPage />
                  </Suspense>
                }
              />

              {/* Authorization: admins only. */}
              <Route element={<RequireRole roles={['admin']} />}>
                <Route
                  path={ROUTES.admin}
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <AdminPage />
                    </Suspense>
                  }
                />
              </Route>
            </Route>
          </Route>

          <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
          <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
