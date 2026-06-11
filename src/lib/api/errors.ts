/** Shown for any 5xx — raw server error bodies must never reach the user. */
export const SERVER_ERROR_MESSAGE =
  'We are experiencing technical difficulties on our end. Please try again shortly.'

export const OFFLINE_MESSAGE =
  'You appear to be offline. Check your internet connection and try again.'

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

interface ApiErrorBody {
  message?: string
  /** Server-side validation messages keyed by field name (400/422). */
  errors?: Record<string, string>
}

/** A response the server answered with a non-2xx status. */
export class ApiError extends Error {
  readonly status: number
  /** Field-level validation messages (400/422), keyed by form field name. */
  readonly fieldErrors?: Record<string, string>

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message ?? `Request failed (HTTP ${status})`)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = body?.errors
  }
}

/** The request never reached the server — offline or connection failure. */
export class NetworkError extends Error {
  constructor(message: string = OFFLINE_MESSAGE, options?: ErrorOptions) {
    super(message, options)
    this.name = 'NetworkError'
  }
}

/**
 * The one place errors are translated for display. 5xx and unknown errors
 * are replaced with safe copy; 4xx messages are written for users and pass
 * through as-is.
 */
export function getUserFacingMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return error.message
  }
  if (error instanceof ApiError) {
    return error.status >= 500 ? SERVER_ERROR_MESSAGE : error.message
  }
  return GENERIC_ERROR_MESSAGE
}
