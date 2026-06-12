import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../features/auth'
import type { UserProfile, UserRole } from '../../features/auth'
import { RequireRole } from './RequireRole'
import { ROUTES } from './paths'

function userWithRole(role: UserRole): UserProfile {
  return { username: 'u', role } as unknown as UserProfile
}

function renderAdminRoute() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.admin]}>
      <Routes>
        <Route element={<RequireRole roles={['admin']} />}>
          <Route path={ROUTES.admin} element={<div>ADMIN PAGE</div>} />
        </Route>
        <Route path={ROUTES.dashboard} element={<div>DASHBOARD</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, restoreStatus: 'done' })
})

afterEach(cleanup)

describe('RequireRole', () => {
  it('renders the route for a user with an allowed role', () => {
    useAuthStore.setState({ user: userWithRole('admin') })
    renderAdminRoute()
    expect(screen.getByText('ADMIN PAGE')).toBeTruthy()
  })

  it('redirects a user whose role is not allowed', () => {
    useAuthStore.setState({ user: userWithRole('user') })
    renderAdminRoute()
    expect(screen.getByText('DASHBOARD')).toBeTruthy()
    expect(screen.queryByText('ADMIN PAGE')).toBeNull()
  })
})
