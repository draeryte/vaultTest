import { ApiError, NetworkError } from './errors'

const API_BASE_URL = 'https://dummyjson.com'

interface ApiFetchOptions extends RequestInit {
  /** JSON-serialized into the request body with the matching Content-Type. */
  json?: unknown
  /** Added as an Authorization: Bearer header. */
  accessToken?: string
}

/**
 * Fetch wrapper used by every feature API module. Throws:
 * - NetworkError when the device is offline or the server is unreachable
 * - ApiError (with status and any field errors) for non-2xx responses
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
