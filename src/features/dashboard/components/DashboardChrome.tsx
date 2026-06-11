import { useEffect, useRef } from 'react'
import { Avatar } from '../../../components/avatar/Avatar'
import { Icon } from '../../../components/icon/Icon'
import type { IconName } from '../../../components/icon/Icon'
import { useAuthStore } from '../../auth'
import styles from './DashboardPage.module.css'

const NOTIFICATION_COUNT = 9

interface NavItem {
  label: string
  icon: IconName
  active?: boolean
  chip?: string
  chevron?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Eleven', icon: 'home' },
  { label: 'Twelve', icon: 'cube', active: true },
  { label: 'Thirteen', icon: 'tag' },
  { label: 'Fourteen', icon: 'people' },
  { label: 'Fifteen', icon: 'grid' },
  { label: 'Sixteen', icon: 'plane', chip: '99+', chevron: true },
]

interface TabItem {
  label: string
  chip?: string
  darkChip?: boolean
  active?: boolean
  disabled?: boolean
}

const TABS: TabItem[] = [
  { label: 'Overview' },
  { label: 'Tasks', chip: '7' },
  { label: 'Documents', chip: '2' },
  { label: 'Team', chip: '99+', darkChip: true, active: true },
  { label: 'Reports' },
  { label: 'Admin', disabled: true },
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

export function SearchField({
  id,
  placeholder,
}: {
  id: string
  placeholder: string
}) {
  return (
    <div className={styles.searchField}>
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

/** The circular avatar shows the logged-in user's image (initials fallback). */
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

export function Sidebar({ onLogout }: { onLogout: () => void }) {
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
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.label}
            className={
              item.active
                ? `${styles.navItem} ${styles.navItemActive}`
                : styles.navItem
            }
            aria-current={item.active ? 'page' : undefined}
          >
            <Icon name={item.icon} className={styles.icon} />
            {item.label}
            {item.chip && <span className={styles.chip}>{item.chip}</span>}
            {item.chevron && <Icon name="chevronDown" className={styles.icon} />}
          </button>
        ))}
      </nav>

      <button type="button" className={styles.logoutItem} onClick={onLogout}>
        <Icon name="logout" className={styles.icon} />
        Log Out
      </button>
    </aside>
  )
}

export function MobileTopBar({ onLogout }: { onLogout: () => void }) {
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

export function MobileBottomNav() {
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
 * Section switcher. These are presentational in phase 1 (the active section is
 * fixed), so they're plain buttons with `aria-current` rather than a faux ARIA
 * tablist — which would promise switchable panels and arrow-key nav that don't
 * exist yet.
 */
export function Tabs() {
  const activeTabRef = useRef<HTMLButtonElement>(null)

  // The strip scrolls horizontally on mobile; keep the active item in view.
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [])

  return (
    <div className={styles.tabs}>
      {TABS.map((tab) => {
        const classes = [styles.tab]
        if (tab.active) classes.push(styles.tabActive)
        if (tab.disabled) classes.push(styles.tabDisabled)
        return (
          <button
            type="button"
            key={tab.label}
            ref={tab.active ? activeTabRef : undefined}
            className={classes.join(' ')}
            aria-current={tab.active ? 'page' : undefined}
            disabled={tab.disabled}
          >
            {tab.label}
            {tab.chip && (
              <span
                className={
                  tab.darkChip ? `${styles.chip} ${styles.chipDark}` : styles.chip
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
