import styles from './RouteFallback.module.css'

/** Suspense fallback shown while a lazily-loaded route chunk is fetched. */
export function RouteFallback() {
  return (
    <p className={styles.fallback} role="status">
      Loading…
    </p>
  )
}
