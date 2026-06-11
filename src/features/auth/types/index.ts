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

export type OAuthProvider = 'google' | 'apple'
