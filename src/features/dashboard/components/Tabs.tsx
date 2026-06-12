import { useEffect, useRef } from 'react'
import styles from './DashboardPage.module.css'

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

/**
 * Dashboard section tabs. Presentational in phase 1 (active section is fixed),
 * so they're plain buttons with `aria-current` rather than a faux ARIA tablist.
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
                  tab.darkChip
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
