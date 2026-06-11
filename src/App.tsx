import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './features/auth'
import { DashboardPage } from './features/dashboard'
import { GuestRoute } from './app/routes/GuestRoute'
import { ProtectedRoute } from './app/routes/ProtectedRoute'
import { RootLayout } from './app/routes/RootLayout'
import { ROUTES } from './app/routes/paths'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {/* Guest-only: an authenticated user is redirected away. */}
          <Route element={<GuestRoute />}>
            <Route path={ROUTES.login} element={<LoginPage />} />
          </Route>

          {/* Protected: an unauthenticated user is redirected to /login. */}
          <Route element={<ProtectedRoute />}>
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />
          </Route>

          <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
          <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
