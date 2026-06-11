import { Skeleton } from '../../../components/skeleton/Skeleton'
import { USERS_PAGE_SIZE } from '../api/users-api'
import tableStyles from './UsersTable.module.css'
import styles from './UsersTableSkeleton.module.css'

/**
 * Loading placeholder for UsersTable. Reuses UsersTable's CSS module so every
 * cell, column, and breakpoint matches the real table exactly — only the row
 * contents are swapped for shimmer blocks. Real header labels stay (they're
 * static chrome, not data).
 */
export function UsersTableSkeleton({ rows = USERS_PAGE_SIZE }: { rows?: number }) {
  return (
    <div className={tableStyles.wrap} aria-busy="true" aria-label="Loading users">
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th className={tableStyles.checkboxCell}>
              <Skeleton width={18} height={18} radius={4} />
            </th>
            <th>
              <span className={tableStyles.sortHeader}>Author</span>
            </th>
            <th className={tableStyles.colWide}>Gender</th>
            <th className={tableStyles.colWide}>Birth Date</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index}>
              <td className={tableStyles.checkboxCell}>
                <Skeleton width={18} height={18} radius={4} />
              </td>
              <td>
                <span className={tableStyles.author}>
                  <Skeleton width={44} height={44} radius="50%" />
                  <span className={styles.lines}>
                    <Skeleton width={130} height={13} />
                    <Skeleton width={180} height={11} />
                  </span>
                </span>
              </td>
              <td className={tableStyles.colWide}>
                <Skeleton width={64} height={13} />
              </td>
              <td className={tableStyles.colWide}>
                <Skeleton width={92} height={13} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
