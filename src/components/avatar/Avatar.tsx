import { useState } from 'react'
import styles from './Avatar.module.css'

interface AvatarProps {
  src?: string
  /** Drives the initials fallback and the default alt text. */
  name?: string
  /** Pass "" to mark the avatar decorative when a name label sits beside it. */
  alt?: string
  size?: number
  className?: string
}

function initials(name?: string): string {
  if (!name) return ''
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Circular avatar with a graceful fallback: if `src` is missing or fails to
 * load, it shows the name's initials instead of a broken image.
 */
export function Avatar({ src, name, alt, size = 40, className }: AvatarProps) {
  const [failed, setFailed] = useState(false)

  // A new src is a fresh chance to load — clear any prior failure during
  // render (React's recommended reset-on-prop-change pattern, no effect).
  const [prevSrc, setPrevSrc] = useState(src)
  if (src !== prevSrc) {
    setPrevSrc(src)
    setFailed(false)
  }

  const label = alt ?? (name ? `${name}'s avatar` : '')
  const classes = className ? `${styles.avatar} ${className}` : styles.avatar
  const dimensions = { width: size, height: size }

  if (src && !failed) {
    return (
      <img
        className={classes}
        style={dimensions}
        src={src}
        alt={label}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span
      className={classes}
      style={{ ...dimensions, fontSize: Math.round(size * 0.4) }}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      {initials(name)}
    </span>
  )
}
