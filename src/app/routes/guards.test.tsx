import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../features/auth'
import type { UserProfile } from '../../features/auth'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from './paths'

const fakeUser = { username: 'emilys' } as unknown as UserProfile

/** Mounts the guard tree with stub pages so we test routing, not the real pages. */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path={ROUTES.login} element={<div>LOGIN PAGE</div>} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.dashboard} element={<div>DASHBOARD</div>} />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, restoreStatus: 'done' })
})

afterEach(cleanup)

describe('ProtectedRoute', () => {
  it('redirects an unauthenticated visitor away from the dashboard', () => {
    renderAt(ROUTES.dashboard)
    expect(screen.getByText('LOGIN PAGE')).toBeTruthy()
    expect(screen.queryByText('DASHBOARD')).toBeNull()
  })

  it('renders the dashboard for an authenticated user', () => {
    useAuthStore.setState({ user: fakeUser })
    renderAt(ROUTES.dashboard)
    expect(screen.getByText('DASHBOARD')).toBeTruthy()
  })
})

describe('GuestRoute', () => {
  it('keeps an authenticated user off the login page', () => {
    useAuthStore.setState({ user: fakeUser })
    renderAt(ROUTES.login)
    expect(screen.getByText('DASHBOARD')).toBeTruthy()
    expect(screen.queryByText('LOGIN PAGE')).toBeNull()
  })

  it('shows the login page to an unauthenticated visitor', () => {
    renderAt(ROUTES.login)
    expect(screen.getByText('LOGIN PAGE')).toBeTruthy()
  })
})
