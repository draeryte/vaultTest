import type { ReactNode } from 'react'

/** Every icon the app knows how to draw. A typo here is a compile error. */
export type IconName =
  | 'home'
  | 'cube'
  | 'tag'
  | 'people'
  | 'grid'
  | 'plane'
  | 'bell'
  | 'gear'
  | 'logout'
  | 'search'
  | 'create'
  | 'menu'
  | 'chevronDown'

const ICON_PATHS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 9.9V21h14V9.9" />
    </>
  ),
  cube: (
    <>
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
      <path d="m3 7 9 5 9-5" />
      <path d="M12 12v10" />
    </>
  ),
  tag: (
    <>
      <path d="M2 12V2h10l10 10-10 10L2 12Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16.5 15.3c2.3.4 4 1.9 4.6 4.2" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="8" height="8" />
      <rect x="13" y="3" width="8" height="8" />
      <rect x="3" y="13" width="8" height="8" />
      <rect x="13" y="13" width="8" height="8" />
    </>
  ),
  plane: <path d="M10.5 13.5 3 11l18-7-7 18-2.5-7.5-1-1Z" />,
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </>
  ),
  create: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h10M4 17h16" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
}

/**
 * Shared line-icon. Sizing comes from the caller's `className` (the SVG has no
 * intrinsic dimensions), so callers control size via their own CSS.
 */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  )
}
