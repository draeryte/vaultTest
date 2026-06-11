export type PageItem = number | 'ellipsis'

/**
 * The page items to render: always the first and last page, a window of ±2
 * around the current page, and an 'ellipsis' marker wherever there's a gap.
 */
export function getPageItems(page: number, pageCount: number): PageItem[] {
  const pages = new Set<number>([1, pageCount])
  for (let p = page - 2; p <= page + 2; p++) {
    if (p >= 1 && p <= pageCount) pages.add(p)
  }
  const sorted = [...pages].sort((a, b) => a - b)

  const items: PageItem[] = []
  let previous = 0
  for (const p of sorted) {
    if (previous && p - previous > 1) items.push('ellipsis')
    items.push(p)
    previous = p
  }
  return items
}
