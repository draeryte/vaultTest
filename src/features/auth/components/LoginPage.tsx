import { useQueryClient } from '@tanstack/react-query'
import { ErrorFallbackCard } from '../../../components/feedback/ErrorFallbackCard'
import { NotFoundState } from '../../../components/feedback/NotFoundState'
import { ApiError, getUserFacingMessage } from '../../../lib/api/errors'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useAuthStore } from '../stores/auth-store'
import { AuthLayout } from './AuthLayout'
import { LoginForm } from './LoginForm'
import { SocialLoginButtons } from './SocialLoginButtons'
import styles from './LoginPage.module.css'

/**
 * Stand-in for the authenticated app: fetches the profile for the stored
 * token and exercises the query error flows. Replaced by routing later.
 */
function AuthenticatedView() {
  const clearUser = useAuthStore((state) => state.clearUser)
  const queryClient = useQueryClient()
  const profile = useCurrentUser()

  function handleLogout() {
    clearUser()
    queryClient.removeQueries({ queryKey: ['auth'] })
  }

  if (profile.isPending) {
    return <p className={styles.loading}>Loading your profile…</p>
  }

  if (profile.isError) {
    // A 401 never reaches here: the global handler in query-client.ts wipes
    // the store, which sends the user straight back to the login form.
    if (profile.error instanceof ApiError && profile.error.status === 404) {
      return <NotFoundState />
    }
    return (
      <ErrorFallbackCard
        message={getUserFacingMessage(profile.error)}
        onRetry={() => void profile.refetch()}
      />
    )
  }

  const user = profile.data
  return (
    <>
      <img
        className={styles.avatar}
        src={user.image}
        alt=""
        width="64"
        height="64"
      />
      <h1 className={styles.title}>
        Welcome back, {user.firstName}
      </h1>
      <p className={styles.signedInText}>
        You are logged in as <strong>{user.firstName}</strong> <strong>{user.lastName}</strong> with username <strong>{user.username}</strong>.
      </p>
      <button
        type="button"
        className={styles.logoutButton}
        onClick={handleLogout}
      >
        Log Out
      </button>
    </>
  )
}

export function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.user !== null)

  if (isAuthenticated) {
    return (
      <AuthLayout>
        <AuthenticatedView />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className={styles.title}>Log In</h1>
      <LoginForm />
      <div className={styles.social}>
        <SocialLoginButtons />
      </div>
      <hr className={styles.divider} />
      <p className={styles.signUp}>
        No account yet?{' '}
        {/* TODO(phase 2): route to the registration flow. */}
        <a className={styles.signUpLink} href="#sign-up">
          Sign Up
        </a>
      </p>
    </AuthLayout>
  )
}
