export type UserRole = 'admin' | 'moderator' | 'user'

/**
 * The POST /auth/login response — tokens plus a thin user summary. Note it does
 * NOT include `role`; that comes from /auth/me (see UserProfile).
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

/**
 * The logged-in user as returned by GET /auth/me — the canonical client
 * profile. It carries `role` (used for authorization) and no tokens. Both
 * login and session-restore resolve to this shape, so a logged-in user always
 * has a role. (/auth/me returns more fields than this; extras are ignored.)
 */
export interface UserProfile {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  gender: string
  image: string
  role: UserRole
}

export interface LoginCredentials {
  /**
   * Sent to the API as `username`. The UI field is labelled "Username" and
   * DummyJSON authenticates by username (e.g. "emilys").
   */
  username: string
  password: string
  /** When true we request a longer-lived access token. */
  rememberMe: boolean
}

/** POST /auth/refresh response — the rotated token pair. */
export interface RefreshedTokens {
  accessToken: string
  refreshToken: string
}

export type OAuthProvider = 'google' | 'apple'
