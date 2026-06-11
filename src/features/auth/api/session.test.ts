import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../stores/auth-store'
import type { AuthenticatedUser } from '../types'
import {
  authFetch,
  markLoggedOut,
  refreshAccessToken,
  restoreSession,
  toUserProfile,
} from './session'

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, restoreStatus: 'idle' })
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('toUserProfile', () => {
  it('strips the access and refresh tokens', () => {
    const user: AuthenticatedUser = {
      id: 1,
      username: 'emilys',
      email: 'e@x.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      gender: 'female',
      image: 'img',
      accessToken: 'a',
      refreshToken: 'r',
    }
    const profile = toUserProfile(user)
    expect(profile).not.toHaveProperty('accessToken')
    expect(profile).not.toHaveProperty('refreshToken')
    expect(profile.username).toBe('emilys')
  })
})

describe('refreshAccessToken', () => {
  it('is single-flight: concurrent callers share one request', async () => {
    let resolveFetch!: (value: Response) => void
    const fetchMock = vi.fn(
      () => new Promise<Response>((resolve) => (resolveFetch = resolve)),
    )
    vi.stubGlobal('fetch', fetchMock)

    const p1 = refreshAccessToken()
    const p2 = refreshAccessToken()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    resolveFetch(jsonResponse({ accessToken: 'fresh', refreshToken: 'r2' }))
    const [t1, t2] = await Promise.all([p1, p2])

    expect(t1).toBe('fresh')
    expect(t2).toBe('fresh')
    expect(useAuthStore.getState().accessToken).toBe('fresh')
  })

  it('resolves null when the refresh request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(null, 401)))
    expect(await refreshAccessToken()).toBeNull()
  })
})

describe('authFetch', () => {
  it('refreshes once and retries the original request on a 401', async () => {
    useAuthStore.setState({ accessToken: 'stale' })
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/refresh')) {
        return jsonResponse({ accessToken: 'renewed', refreshToken: 'r2' })
      }
      const auth = (init?.headers as Record<string, string>)?.Authorization
      return auth === 'Bearer renewed'
        ? jsonResponse({ data: 'ok' })
        : jsonResponse({ message: 'expired' }, 401)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await authFetch<{ data: string }>('/users')

    expect(result).toEqual({ data: 'ok' })
    // original 401 → refresh → retry
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(useAuthStore.getState().accessToken).toBe('renewed')
  })

  it('propagates the 401 when refresh also fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'expired' }, 401)),
    )

    await expect(authFetch('/users')).rejects.toMatchObject({ status: 401 })
  })
})

describe('restoreSession', () => {
  it('hydrates the store from the cookie session', async () => {
    const profile = { id: 1, username: 'emilys', firstName: 'Emily' }
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(profile)))

    await restoreSession()

    expect(useAuthStore.getState().user).toMatchObject({ username: 'emilys' })
    expect(useAuthStore.getState().restoreStatus).toBe('done')
  })

  it('skips the network entirely when the user explicitly logged out', async () => {
    markLoggedOut()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await restoreSession()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().restoreStatus).toBe('done')
  })

  it('is idempotent — a second call does not refetch', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ username: 'emilys' }))
    vi.stubGlobal('fetch', fetchMock)

    await restoreSession()
    await restoreSession()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
