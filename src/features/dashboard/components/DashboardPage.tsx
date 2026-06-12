import { useState } from 'react'
import { ErrorFallbackCard } from '../../../components/feedback/ErrorFallbackCard'
import { NotFoundState } from '../../../components/feedback/NotFoundState'
import { SearchField } from '../../../components/search/SearchField'
import { ApiError, getUserFacingMessage } from '../../../lib/api/errors'
import { USERS_PAGE_SIZE } from '../api/users-api'
import { useUsers } from '../hooks/useUsers'
import { Pagination } from './Pagination'
import { Tabs } from './Tabs'
import { UsersTable } from './UsersTable'
import { UsersTableSkeleton } from './UsersTableSkeleton'
import styles from './DashboardPage.module.css'

/** Dashboard page content. Renders inside the AppLayout shell's <Outlet/>. */
export function DashboardPage() {
  const [page, setPage] = useState(1)
  const usersQuery = useUsers(page)

  const pageCount = usersQuery.data
    ? Math.max(1, Math.ceil(usersQuery.data.total / USERS_PAGE_SIZE))
    : 0

  return (
    <>
      <h1 className={styles.title}>Dashboard</h1>

      <div className={styles.controls}>
        <Tabs />
        <div className={styles.controlsSearch}>
          <SearchField
            id="dashboard-search"
            placeholder="Search"
            className={styles.dashboardSearch}
          />
        </div>
      </div>

      {usersQuery.isPending && <UsersTableSkeleton />}

      {usersQuery.isError &&
        (usersQuery.error instanceof ApiError &&
        usersQuery.error.status === 404 ? (
          <NotFoundState />
        ) : (
          <ErrorFallbackCard
            message={getUserFacingMessage(usersQuery.error)}
            onRetry={() => void usersQuery.refetch()}
          />
        ))}

      {usersQuery.data && (
        <>
          {/* Dim only the table while the next page loads; pagination stays
              interactive. `key={page}` resets row-selection per page. */}
          <div
            className={
              usersQuery.isPlaceholderData ? styles.pendingPage : undefined
            }
          >
            <UsersTable key={page} users={usersQuery.data.users} />
          </div>
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}
    </>
  )
}
