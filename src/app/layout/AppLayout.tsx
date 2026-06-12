import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Avatar } from '../../components/avatar/Avatar'
import { ConfirmDialog } from '../../components/dialog/ConfirmDialog'
import { Icon } from '../../components/icon/Icon'
import type { IconName } from '../../components/icon/Icon'
import { SearchField } from '../../components/search/SearchField'
import { useAuthStore, useLogout } from '../../features/auth'
import type { UserRole } from '../../features/auth'
import { ROUTES } from '../routes/paths'
import styles from './AppLayout.module.css'

const NOTIFICATION_COUNT = 9

interface NavItem {
  label: string
  icon: IconName
  to: string
  /** When set, the item only appears for users with this role. */
  requiredRole?: UserRole
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'cube', to: ROUTES.dashboard },
  { label: 'Admin', icon: 'grid', to: ROUTES.admin, requiredRole: 'admin' },
]

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
      <Icon name="bell" className={styles.icon} />
      <span className={styles.badge}>{NOTIFICATION_COUNT}</span>
    </button>
  )
}

function UserAvatar({ size = 40 }: { size?: number }) {
  const image = useAuthStore((state) => state.user?.image)
  const firstName = useAuthStore((state) => state.user?.firstName)
  return (
    <Avatar
      src={image}
      name={firstName}
      alt={firstName ? `${firstName}'s avatar` : 'Your avatar'}
      size={size}
    />
  )
}

function navItemClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
}

function Sidebar({
  role,
  onLogout,
}: {
  role: UserRole | undefined
  onLogout: () => void
}) {
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
          <Icon name="gear" className={styles.icon} />
        </button>
        <NotificationBell />
      </div>

      <SearchField id="sidebar-search" placeholder="Search for..." />

      <nav className={styles.nav} aria-label="Main navigation">
        {NAV_ITEMS.filter(
          (item) => !item.requiredRole || item.requiredRole === role,
        ).map((item) => (
          <NavLink key={item.label} to={item.to} className={navItemClass}>
            <Icon name={item.icon} className={styles.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button type="button" className={styles.logoutItem} onClick={onLogout}>
        <Icon name="logout" className={styles.icon} />
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
          <Icon name="gear" className={styles.icon} />
        </button>
        <UserAvatar size={36} />
        <button
          type="button"
          className={styles.iconButton}
          onClick={onLogout}
          aria-label="Log out"
        >
          <Icon name="logout" className={styles.icon} />
        </button>
      </div>
    </header>
  )
}

const BOTTOM_NAV_ITEMS: { label: string; icon: IconName }[] = [
  { label: 'Home', icon: 'home' },
  { label: 'Network', icon: 'people' },
  { label: 'Create', icon: 'create' },
  { label: 'Search', icon: 'search' },
  { label: 'Menu', icon: 'menu' },
]

function MobileBottomNav() {
  return (
    <nav className={styles.bottomNav} aria-label="Mobile navigation">
      {BOTTOM_NAV_ITEMS.map((item) => (
        <button type="button" key={item.label} className={styles.bottomNavItem}>
          <Icon name={item.icon} className={styles.icon} />
          {item.label}
        </button>
      ))}
    </nav>
  )
}

/**
 * The authenticated app shell: sidebar (desktop) / top + bottom bars (mobile)
 * around an `<Outlet/>` where the active page renders. As a layout route it's
 * mounted once and shared by every protected page, so new pages don't
 * re-implement the chrome. Owns the logout confirmation.
 */
export function AppLayout() {
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const role = useAuthStore((state) => state.user?.role)
  const logout = useLogout()

  const requestLogout = () => setConfirmingLogout(true)

  return (
    <div className={styles.shell}>
      <Sidebar role={role} onLogout={requestLogout} />
      <MobileTopBar onLogout={requestLogout} />

      <main className={styles.main}>
        <Outlet />
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
