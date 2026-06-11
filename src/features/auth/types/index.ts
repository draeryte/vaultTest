/**
 * The logged-in user — mirrors the POST https://dummyjson.com/auth/login
 * response body one-to-one.
 */
export interface AuthenticatedUser {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  gender: string
  image: string
  /** JWT access token (also set as a cookie by the API). */
  accessToken: string
  /** JWT refresh token (also set as a cookie by the API). */
  refreshToken: string
}

export interface LoginCredentials {
  /**
   * Sent to the API as `username`. The UI field is labelled "Email Address"
   * per the design, but DummyJSON authenticates by username (e.g. "emilys"),
   * so either form is accepted.
   */
  username: string
  password: string
  /** When true we request a longer-lived access token. */
  rememberMe: boolean
}

/**
 * The profile returned by GET /auth/me — same user shape, but the endpoint
 * does not echo tokens back. Also the only user shape the client retains:
 * tokens are stripped before anything is stored.
 */
export type UserProfile = Omit<AuthenticatedUser, 'accessToken' | 'refreshToken'>

/** POST /auth/refresh response — the rotated token pair. */
export interface RefreshedTokens {
  accessToken: string
  refreshToken: string
}

export type OAuthProvider = 'google' | 'apple'
