import { Icon } from '../icon/Icon'
import styles from './SearchField.module.css'

interface SearchFieldProps {
  id: string
  placeholder: string
  /** Extra class merged onto the field (e.g. to change its background). */
  className?: string
}

/** Search input with a leading icon. Presentational for now (no wired search). */
export function SearchField({ id, placeholder, className }: SearchFieldProps) {
  return (
    <div className={className ? `${styles.field} ${className}` : styles.field}>
      <Icon name="search" className={styles.icon} />
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        aria-label="Search"
      />
    </div>
  )
}
