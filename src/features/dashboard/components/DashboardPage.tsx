import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '../../../components/dialog/ConfirmDialog'
import { ErrorFallbackCard } from '../../../components/feedback/ErrorFallbackCard'
import { NotFoundState } from '../../../components/feedback/NotFoundState'
import { ApiError, getUserFacingMessage } from '../../../lib/api/errors'
import { useAuthStore, useLogout } from '../../auth'
import { USERS_PAGE_SIZE } from '../api/users-api'
import { useUsers } from '../hooks/useUsers'
import { Pagination } from './Pagination'
import { UsersTable } from './UsersTable'
import { UsersTableSkeleton } from './UsersTableSkeleton'
import styles from './DashboardPage.module.css'

const NOTIFICATION_COUNT = 9

const NAV_ITEMS = [
  { label: 'Eleven', icon: 'home' },
  { label: 'Twelve', icon: 'cube', active: true },
  { label: 'Thirteen', icon: 'tag' },
  { label: 'Fourteen', icon: 'people' },
  { label: 'Fifteen', icon: 'grid' },
  { label: 'Sixteen', icon: 'plane', chip: '99+', chevron: true },
] as const

const TABS = [
  { label: 'Overview' },
  { label: 'Tasks', chip: '7' },
  { label: 'Documents', chip: '2' },
  { label: 'Team', chip: '99+', darkChip: true, active: true },
  { label: 'Reports' },
  { label: 'Admin', disabled: true },
] as const

function Icon({ name }: { name: string }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'home' && (
        <>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 9.9V21h14V9.9" />
        </>
      )}
      {name === 'cube' && (
        <>
          <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
          <path d="m3 7 9 5 9-5" />
          <path d="M12 12v10" />
        </>
      )}
      {name === 'tag' && (
        <>
          <path d="M2 12V2h10l10 10-10 10L2 12Z" />
          <circle cx="7.5" cy="7.5" r="1.5" />
        </>
      )}
      {name === 'people' && (
        <>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M16.5 15.3c2.3.4 4 1.9 4.6 4.2" />
        </>
      )}
      {name === 'grid' && (
        <>
          <rect x="3" y="3" width="8" height="8" />
          <rect x="13" y="3" width="8" height="8" />
          <rect x="3" y="13" width="8" height="8" />
          <rect x="13" y="13" width="8" height="8" />
        </>
      )}
      {name === 'plane' && <path d="M10.5 13.5 3 11l18-7-7 18-2.5-7.5-1-1Z" />}
      {name === 'bell' && (
        <>
          <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </>
      )}
      {name === 'gear' && (
        <>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
        </>
      )}
      {name === 'logout' && (
        <>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </>
      )}
      {name === 'search' && (
        <>
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </>
      )}
      {name === 'create' && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8v8M8 12h8" />
        </>
      )}
      {name === 'menu' && <path d="M4 7h16M4 12h10M4 17h16" />}
      {name === 'chevronDown' && <path d="m6 9 6 6 6-6" />}
    </svg>
  )
}

function BrandMark() {
  return (
    <svg
      className={styles.brandIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" />
      <path d="m3 3 18 18M21 3 3 21" />
    </svg>
  )
}

function NotificationBell() {
  return (
    <button
      type="button"
      className={styles.iconButton}
      aria-label={`Notifications (${NOTIFICATION_COUNT} unread)`}
    >
      <Icon name="bell" />
      <span className={styles.badge}>{NOTIFICATION_COUNT}</span>
    </button>
  )
}

function SearchField({ id, placeholder }: { id: string; placeholder: string }) {
  return (
    <div className={styles.searchField}>
      <Icon name="search" />
      <input id={id} type="search" placeholder={placeholder} aria-label="Search" />
    </div>
  )
}

/** The circular avatar shows the logged-in user's image. */
function UserAvatar() {
  const image = useAuthStore((state) => state.user?.image)
  const name = useAuthStore((state) => state.user?.firstName)
  return (
    <img
      className={styles.avatar}
      src={image}
      alt={name ? `${name}'s avatar` : 'Your avatar'}
      width="40"
      height="40"
    />
  )
}

function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <BrandMark />
        <span>
          <span className={styles.brandName}>WebbyFrames</span>
          <span className={styles.brandSub}>for Figma</span>
        </span>
      </div>

      <div className={styles.iconRow}>
        <UserAvatar />
        <button type="button" className={styles.iconButton} aria-label="Settings">
          <Icon name="gear" />
        </button>
        <NotificationBell />
      </div>

      <SearchField id="sidebar-search" placeholder="Search for..." />

      <nav className={styles.nav} aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.label}
            className={
              'active' in item && item.active
                ? `${styles.navItem} ${styles.navItemActive}`
                : styles.navItem
            }
          >
            <Icon name={item.icon} />
            {item.label}
            {'chip' in item && <span className={styles.chip}>{item.chip}</span>}
            {'chevron' in item && <Icon name="chevronDown" />}
          </button>
        ))}
      </nav>

      <button type="button" className={styles.logoutItem} onClick={onLogout}>
        <Icon name="logout" />
        Log Out
      </button>
    </aside>
  )
}

function MobileTopBar({ onLogout }: { onLogout: () => void }) {
  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <BrandMark />
        <span className={styles.brandName}>WebbyFrames</span>
      </div>
      <div className={styles.iconRow}>
        <NotificationBell />
        <button type="button" className={styles.iconButton} aria-label="Settings">
          <Icon name="gear" />
        </button>
        <UserAvatar />
        <button
          type="button"
          className={styles.iconButton}
          onClick={onLogout}
          aria-label="Log out"
        >
          <Icon name="logout" />
        </button>
      </div>
    </header>
  )
}

function MobileBottomNav() {
  const items = [
    { label: 'Home', icon: 'home' },
    { label: 'Network', icon: 'people' },
    { label: 'Create', icon: 'create' },
    { label: 'Search', icon: 'search' },
    { label: 'Menu', icon: 'menu' },
  ]
  return (
    <nav className={styles.bottomNav} aria-label="Mobile navigation">
      {items.map((item) => (
        <button type="button" key={item.label} className={styles.bottomNavItem}>
          <Icon name={item.icon} />
          {item.label}
        </button>
      ))}
    </nav>
  )
}

function Tabs() {
  const activeTabRef = useRef<HTMLButtonElement>(null)

  // The tab strip scrolls horizontally on mobile; keep the active tab visible.
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [])

  return (
    <div className={styles.tabs} role="tablist" aria-label="Dashboard sections">
      {TABS.map((tab) => {
        const active = 'active' in tab && tab.active
        const classes = [styles.tab]
        if (active) classes.push(styles.tabActive)
        if ('disabled' in tab && tab.disabled) classes.push(styles.tabDisabled)
        return (
          <button
            type="button"
            role="tab"
            key={tab.label}
            ref={active ? activeTabRef : undefined}
            className={classes.join(' ')}
            aria-selected={active}
            disabled={'disabled' in tab && tab.disabled}
          >
            {tab.label}
            {'chip' in tab && (
              <span
                className={
                  'darkChip' in tab && tab.darkChip
                    ? `${styles.chip} ${styles.chipDark}`
                    : styles.chip
                }
              >
                {tab.chip}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

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
          <div
            className={
              usersQuery.isPlaceholderData ? styles.pendingPage : undefined
            }
          >
            <UsersTable users={usersQuery.data.users} />
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </div>
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
