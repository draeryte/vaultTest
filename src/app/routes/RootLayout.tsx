import { Outlet } from 'react-router-dom'
import { OfflineBanner } from '../../components/feedback/OfflineBanner'
import { useRestoreSession } from '../../features/auth'
import styles from './RootLayout.module.css'

/**
 * Top-level layout for every route. It kicks off the one-time cookie-session
 * restore and holds rendering until it finishes, so the route guards below
 * always make their decision against a settled auth state — a logged-in user
 * deep-linking (or refreshing) a protected route isn't briefly bounced to
 * login while `/auth/me` is still in flight.
 */
export function RootLayout() {
  const restoreStatus = useRestoreSession()

  return (
    <>
      <OfflineBanner />
      {restoreStatus === 'done' ? (
        <Outlet />
      ) : (
        <p className={styles.restoring}>Checking your session…</p>
      )}
    </>
  )
}
