import styles from './ErrorFallbackCard.module.css'

interface ErrorFallbackCardProps {
  /** User-safe copy — pass it through getUserFacingMessage, never a raw error. */
  message: string
  /** Wire this to the failing query's refetch() so no page reload is needed. */
  onRetry: () => void
}

export function ErrorFallbackCard({ message, onRetry }: ErrorFallbackCardProps) {
  return (
    <div className={styles.card} role="alert">
      <h2 className={styles.title}>Something went wrong</h2>
      <p className={styles.message}>{message}</p>
      <button type="button" className={styles.retry} onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
