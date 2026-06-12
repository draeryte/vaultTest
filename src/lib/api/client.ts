import { ApiError, NetworkError } from './errors'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy .env.example to .env and define it.',
  )
}
// Same-origin paths inherit the page's protocol; absolute URLs must be https.
if (
  import.meta.env.PROD &&
  !API_BASE_URL.startsWith('https://') &&
  !API_BASE_URL.startsWith('/')
) {
  throw new Error(
    'VITE_API_BASE_URL must be https or a same-origin path in production builds.',
  )
}

export interface ApiFetchOptions extends RequestInit {
  /** JSON-serialized into the request body with the matching Content-Type. */
  json?: unknown
  /** Added as an Authorization: Bearer header. */
  accessToken?: string
}

/**
 * Low-level fetch wrapper — use this only for *unauthenticated* endpoints
 * (login, refresh). For everything that needs a session, use `authFetch`,
 * which adds the bearer token and refresh-on-401. Throws:
 * - NetworkError when the device is offline or the server is unreachable
 * - ApiError (with status and any field errors) for non-2xx responses
 *
 * Requests include credentials so the HttpOnly auth cookies set by the
 * server ride along. JavaScript never reads or writes those cookies — that
 * is what keeps them out of reach of XSS. Cookie auth means the real
 * backend must pair this with CSRF protection on mutating endpoints
 * (SameSite plus a CSRF token).
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { json, accessToken, headers, ...init } = options

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new NetworkError()
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...init,
      headers: {
        ...(json !== undefined && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : init.body,
    })
  } catch (error) {
    // fetch rejects with TypeError when the connection itself fails.
    throw new NetworkError(undefined, { cause: error })
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body)
  }

  return (await response.json()) as T
}

/**
 * Connects this neutral client to whoever owns the session (the auth feature),
 * without `lib/` having to depend on a feature. The auth feature registers its
 * token accessor and refresh routine once at startup via `registerAuthBridge`.
 */
export interface AuthBridge {
  /** Current in-memory access token, if any. */
  getAccessToken: () => string | undefined
  /** Attempt to renew the session; resolves to a new access token or null. */
  refresh: () => Promise<string | null>
}

let authBridge: AuthBridge | null = null

export function registerAuthBridge(bridge: AuthBridge): void {
  authBridge = bridge
}

/**
 * The default client for authenticated endpoints. Attaches the current bearer
 * token (cookies ride along regardless via `apiFetch`), and on a 401 refreshes
 * the session once and retries. If refresh fails the original 401 propagates,
 * which the global handler turns into a logout. Features should reach for this,
 * not `apiFetch`, so auth handling is never accidentally skipped.
 */
export async function authFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const accessToken = authBridge?.getAccessToken()
  try {
    return await apiFetch<T>(path, { ...options, accessToken })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && authBridge) {
      const renewed = await authBridge.refresh()
      if (renewed) {
        return apiFetch<T>(path, { ...options, accessToken: renewed })
      }
    }
    throw error
  }
}
