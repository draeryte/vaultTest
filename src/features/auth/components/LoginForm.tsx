import { useState } from 'react'
import type {SubmitEvent } from 'react'
import { ApiError, getUserFacingMessage } from '../../../lib/api/errors'
import { useLogin } from '../hooks/useLogin'
import styles from './LoginForm.module.css'

/** Validation statuses whose body may carry per-field server messages. */
function isValidationError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.status === 400 || error.status === 422) &&
    Boolean(error.fieldErrors)
  )
}

interface FieldErrors {
  username?: string
  password?: string
}

const PASSWORD_HINT =
  'It must be a combination of minimum 8 letters, numbers, and symbols.'

function validate(username: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  const identifier = username.trim()
  if (!identifier) {
    errors.username = 'Username is required.'
  } else if (identifier.includes('@') && !/^\S+@\S+\.\S+$/.test(identifier)) {
    // DummyJSON authenticates by username (e.g. "emilys"), so bare usernames
    // pass; anything email-shaped must be well-formed.
    errors.username = 'Enter a valid username.'
  }
  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < 8) {
    errors.password = PASSWORD_HINT
  }
  return errors
}

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const login = useLogin()

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validate(username, password)
    setFieldErrors(errors)
    if (errors.username || errors.password) return
    login.mutate(
      { username: username.trim(), password, rememberMe },
      {
        onError: (error) => {
          // 400/422 validation messages land under their form inputs.
          if (isValidationError(error)) {
            setFieldErrors({
              username: error.fieldErrors?.username,
              password: error.fieldErrors?.password,
            })
          }
        },
      },
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-username">
          Username
        </label>
        <input
          id="login-username"
          className={styles.input}
          type="text"
          name="username"
          autoComplete="username"
          placeholder="Placeholder"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          aria-invalid={Boolean(fieldErrors.username)}
        />
        {fieldErrors.username && (
          <p className={styles.error} role="alert">
            {fieldErrors.username}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-password">
          Password
        </label>
        <div className={styles.passwordWrap}>
          <input
            id="login-password"
            className={styles.input}
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            placeholder="Placeholder"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          <button
            type="button"
            className={styles.eyeButton}
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {fieldErrors.password ? (
          <p className={styles.error} role="alert">
            {fieldErrors.password}
          </p>
        ) : (
          <p className={styles.hint}>{PASSWORD_HINT}</p>
        )}
      </div>

      <div className={styles.optionsRow}>
        <label className={styles.remember}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          Remember me
        </label>
        {/* TODO(phase 2): route to the password-reset flow. */}
        <a className={styles.link} href="#forgot-password">
          Forgot Password?
        </a>
      </div>

      {login.isError && !isValidationError(login.error) && (
        <p className={styles.formError} role="alert">
          {getUserFacingMessage(login.error)}
        </p>
      )}

      <button
        type="submit"
        className={styles.submit}
        disabled={login.isPending}
      >
        {login.isPending ? 'Logging In…' : 'Log In'}
      </button>
    </form>
  )
}
