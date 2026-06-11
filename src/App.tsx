import { OfflineBanner } from './components/feedback/OfflineBanner'
import { LoginPage, useIsAuthenticated, useRestoreSession } from './features/auth'
import { DashboardPage } from './features/dashboard'
import styles from './App.module.css'

function App() {
  const restoreStatus = useRestoreSession()
  const isAuthenticated = useIsAuthenticated()

  let view
  if (restoreStatus !== 'done') {
    view = <p className={styles.restoring}>Checking your session…</p>
  } else if (isAuthenticated) {
    view = <DashboardPage />
  } else {
    view = <LoginPage />
  }

  return (
    <>
      <OfflineBanner />
      {view}
    </>
  )
}

export default App
