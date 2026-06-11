import { useOnlineStatus } from '../../lib/hooks/useOnlineStatus'
import styles from './OfflineBanner.module.css'

/** Site-wide banner shown while the device has no internet connection. */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className={styles.banner} role="status">
      You're offline. Check your internet connection — we'll keep your place.
    </div>
  )
}
