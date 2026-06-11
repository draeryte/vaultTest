import { AuthLayout } from './AuthLayout'
import { LoginForm } from './LoginForm'
import { SocialLoginButtons } from './SocialLoginButtons'
import styles from './LoginPage.module.css'

export function LoginPage() {
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
