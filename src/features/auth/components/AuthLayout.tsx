import type { ReactNode } from 'react'
import authImage from '../../../assets/IMG_0167.jpg'
import styles from './AuthLayout.module.css'

/**
 * Responsive auth shell. Desktop: form on the left, brand image panel on the
 * right. Mobile: image banner on top, form below.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <main className={styles.formPane}>
        <div className={styles.formContent}>{children}</div>
      </main>
      <aside className={styles.imagePane} aria-hidden="true">
        <img className={styles.image} src={authImage} alt="" />
      </aside>
    </div>
  )
}
