import { useAuthStore } from '../../auth'
import styles from './AdminPage.module.css'

/** Admin-only page. Reached only via the RequireRole(['admin']) route guard. */
export function AdminPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <>
      <h1 className={styles.title}>Admin</h1>
      <p className={styles.body}>
        This area is restricted to administrators. You're signed in as{' '}
        <strong>
          {user?.firstName} {user?.lastName}
        </strong>{' '}
        with the <strong>{user?.role}</strong> role.
      </p>
    </>
  )
}
