import type { ReactNode } from 'react'
import styles from './AuthLayout.module.css'

/**
 * Responsive auth shell. Desktop: form on the left, brand image panel on the
 * right. Mobile: image panel banner on top, form below.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <main className={styles.formPane}>
        <div className={styles.formContent}>{children}</div>
      </main>
      {/* Placeholder panel — swap the glyph for brand imagery when available. */}
      <aside className={styles.imagePane} aria-hidden="true">
        <svg
          className={styles.placeholder}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
          <line
            x1="10"
            y1="10"
            x2="90"
            y2="90"
            stroke="currentColor"
            strokeWidth="7"
          />
          <line
            x1="90"
            y1="10"
            x2="10"
            y2="90"
            stroke="currentColor"
            strokeWidth="7"
          />
        </svg>
      </aside>
    </div>
  )
}
