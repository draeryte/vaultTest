import type { CSSProperties } from 'react'
import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  /** Border radius; use "50%" for circular placeholders like avatars. */
  radius?: number | string
  className?: string
}

/** A single shimmering placeholder block. Decorative — hidden from a11y tree. */
export function Skeleton({ width, height, radius, className }: SkeletonProps) {
  const style: CSSProperties = { width, height, borderRadius: radius }
  return (
    <span
      className={className ? `${styles.skeleton} ${className}` : styles.skeleton}
      style={style}
      aria-hidden="true"
    />
  )
}
