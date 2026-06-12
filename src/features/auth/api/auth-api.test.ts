import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getCurrentUser,
  login,
  loginWithProvider,
  logout,
  requestPasswordReset,
} from './auth-api'

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('login', () => {
  it('posts the credentials and a 60-minute session when rememberMe is false', async () => {
    let calledUrl = ''
    let calledInit: RequestInit | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calledUrl = url
        calledInit = init
        return jsonResponse({
          id: 1,
          username: 'emilys',
          email: 'e@x.com',
          firstName: 'Emily',
          lastName: 'Johnson',
          gender: 'female',
          image: 'img',
          accessToken: 'a',
          refreshToken: 'r',
        })
      }),
    )

    const user = await login({
      username: 'emilys',
      password: 'emilyspass',
      rememberMe: false,
    })

    expect(calledUrl).toContain('/auth/login')
    expect(calledInit?.method).toBe('POST')
    expect(JSON.parse(String(calledInit?.body))).toEqual({
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 60,
    })
    expect(user.username).toBe('emilys')
    expect(user.accessToken).toBe('a')
  })

  it('requests a 7-day session when rememberMe is true', async () => {
    let calledInit: RequestInit | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        calledInit = init
        return jsonResponse({ username: 'emilys' })
      }),
    )

    await login({ username: 'emilys', password: 'emilyspass', rememberMe: true })

    expect(JSON.parse(String(calledInit?.body)).expiresInMins).toBe(7 * 24 * 60)
  })

  it('throws an ApiError carrying the status and message on invalid credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'Invalid credentials' }, 400)),
    )

    await expect(
      login({ username: 'emilys', password: 'wrong', rememberMe: false }),
    ).rejects.toMatchObject({ status: 400, message: 'Invalid credentials' })
  })
})

describe('getCurrentUser', () => {
  it('fetches the profile (with role) from /auth/me', async () => {
    let calledUrl = ''
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calledUrl = url
        return jsonResponse({ id: 1, username: 'emilys', role: 'admin' })
      }),
    )

    const profile = await getCurrentUser()

    expect(calledUrl).toContain('/auth/me')
    expect(profile.role).toBe('admin')
  })
})

describe('stubs', () => {
  it('loginWithProvider resolves a stub profile with the user role', async () => {
    vi.useFakeTimers()
    const promise = loginWithProvider('google')
    await vi.advanceTimersByTimeAsync(1000)

    await expect(promise).resolves.toMatchObject({
      username: 'demo.google',
      role: 'user',
      email: expect.stringContaining('google'),
    })
  })

  it('requestPasswordReset resolves without throwing', async () => {
    vi.useFakeTimers()
    const promise = requestPasswordReset('user@example.com')
    await vi.advanceTimersByTimeAsync(1000)
    await expect(promise).resolves.toBeUndefined()
  })

  it('logout resolves without throwing', async () => {
    vi.useFakeTimers()
    const promise = logout()
    await vi.advanceTimersByTimeAsync(1000)
    await expect(promise).resolves.toBeUndefined()
  })
})
