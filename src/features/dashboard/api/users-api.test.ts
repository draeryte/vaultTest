import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../../auth'
import { USERS_PAGE_SIZE, getUsers } from './users-api'

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response
}

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, restoreStatus: 'idle' })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getUsers', () => {
  it('requests the right page window and only the consumed fields', async () => {
    const page = { users: [], total: 208, skip: 10, limit: USERS_PAGE_SIZE }
    let url = ''
    vi.stubGlobal(
      'fetch',
      vi.fn(async (requestUrl: string) => {
        url = requestUrl
        return jsonResponse(page)
      }),
    )

    const result = await getUsers(2)

    expect(result).toEqual(page)
    expect(url).toContain(`limit=${USERS_PAGE_SIZE}`)
    expect(url).toContain('skip=10') // (page 2 - 1) * 10
    expect(url).toContain('select=firstName,lastName')
    // Sensitive fields must never be requested.
    expect(url).not.toContain('password')
    expect(url).not.toContain('ssn')
  })
})
