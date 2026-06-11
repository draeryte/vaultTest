import { useAuthStore } from '../stores/auth-store'
import { AuthLayout } from './AuthLayout'
import { LoginForm } from './LoginForm'
import { SocialLoginButtons } from './SocialLoginButtons'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const user = useAuthStore((state) => state.user)
  const clearUser = useAuthStore((state) => state.clearUser)

  // Stand-in for the authenticated app: proves the login flow writes the
  // user to the store. Replaced by real routing in a later phase.
  if (user) {
    return (
      <AuthLayout>
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
          onClick={clearUser}
        >
          Log Out
        </button>
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
