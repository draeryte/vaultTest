import { useState } from 'react'
import { ConfirmDialog } from '../../../components/dialog/ConfirmDialog'
import { ErrorFallbackCard } from '../../../components/feedback/ErrorFallbackCard'
import { NotFoundState } from '../../../components/feedback/NotFoundState'
import { ApiError, getUserFacingMessage } from '../../../lib/api/errors'
import { useLogout } from '../../auth'
import { USERS_PAGE_SIZE } from '../api/users-api'
import { useUsers } from '../hooks/useUsers'
import {
  MobileBottomNav,
  MobileTopBar,
  SearchField,
  Sidebar,
  Tabs,
} from './DashboardChrome'
import { Pagination } from './Pagination'
import { UsersTable } from './UsersTable'
import { UsersTableSkeleton } from './UsersTableSkeleton'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const [page, setPage] = useState(1)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const usersQuery = useUsers(page)
  const logout = useLogout()

  const pageCount = usersQuery.data
    ? Math.max(1, Math.ceil(usersQuery.data.total / USERS_PAGE_SIZE))
    : 0

  const requestLogout = () => setConfirmingLogout(true)

  return (
    <div className={styles.shell}>
      <Sidebar onLogout={requestLogout} />
      <MobileTopBar onLogout={requestLogout} />

      <main className={styles.main}>
        <h1 className={styles.title}>Dashboard</h1>

        <div className={styles.controls}>
          <Tabs />
          <div className={styles.controlsSearch}>
            <SearchField id="dashboard-search" placeholder="Search" />
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
                interactive. `key={page}` remounts the table per page so its
                row-selection state never leaks across pages. */}
            <div
              className={
                usersQuery.isPlaceholderData ? styles.pendingPage : undefined
              }
            >
              <UsersTable key={page} users={usersQuery.data.users} />
            </div>
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </>
        )}
      </main>

      <MobileBottomNav />

      <ConfirmDialog
        open={confirmingLogout}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        onConfirm={() => {
          setConfirmingLogout(false)
          logout()
        }}
        onCancel={() => setConfirmingLogout(false)}
      />
    </div>
  )
}
