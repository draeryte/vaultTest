import styles from './NotFoundState.module.css'

interface NotFoundStateProps {
  title?: string
  description?: string
}

/** Purposeful empty state for 404s — rendered in place of a broken page. */
export function NotFoundState({
  title = 'Item not found',
  description = "The item you're looking for doesn't exist or may have been removed.",
}: NotFoundStateProps) {
  return (
    <div className={styles.container} role="status">
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
        <line x1="8.5" y1="11" x2="13.5" y2="11" />
      </svg>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  )
}
