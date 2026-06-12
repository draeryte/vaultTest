import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installAuthBridge, markLoggedOut } from '../api/session'
import { useAuthStore } from '../stores/auth-store'
import { useLogin } from './useLogin'

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, restoreStatus: 'idle' })
  localStorage.clear()
  installAuthBridge()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useLogin', () => {
  it('logs in then loads the role-bearing profile from /auth/me', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/auth/login')) {
          // The login response has tokens but no role.
          return jsonResponse({
            id: 1,
            username: 'emilys',
            accessToken: 'tok',
            refreshToken: 'r',
          })
        }
        if (url.endsWith('/auth/me')) {
          return jsonResponse({
            id: 1,
            username: 'emilys',
            firstName: 'Emily',
            role: 'admin',
          })
        }
        return jsonResponse({}, 404)
      }),
    )
    markLoggedOut() // login should clear this

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })
    result.current.mutate({
      username: 'emilys',
      password: 'emilyspass',
      rememberMe: false,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const state = useAuthStore.getState()
    expect(state.user).toMatchObject({ username: 'emilys', role: 'admin' })
    expect(state.accessToken).toBe('tok')
    expect(localStorage.getItem('auth:logged-out')).toBeNull()
  })

  it('errors and writes no user when credentials are rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/auth/login')
          ? jsonResponse({ message: 'Invalid credentials' }, 400)
          : jsonResponse({}, 404),
      ),
    )

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })
    result.current.mutate({
      username: 'emilys',
      password: 'wrong',
      rememberMe: false,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(useAuthStore.getState().user).toBeNull()
  })
})
