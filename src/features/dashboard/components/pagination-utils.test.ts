import { describe, expect, it } from 'vitest'
import { getPageItems } from './pagination-utils'

describe('getPageItems', () => {
  it('returns every page with no ellipsis when they all fit the window', () => {
    expect(getPageItems(1, 1)).toEqual([1])
    expect(getPageItems(2, 3)).toEqual([1, 2, 3])
  })

  it('collapses the trailing gap near the start', () => {
    expect(getPageItems(1, 11)).toEqual([1, 2, 3, 'ellipsis', 11])
    expect(getPageItems(2, 11)).toEqual([1, 2, 3, 4, 'ellipsis', 11])
  })

  it('collapses both gaps in the middle', () => {
    expect(getPageItems(6, 11)).toEqual([
      1,
      'ellipsis',
      4,
      5,
      6,
      7,
      8,
      'ellipsis',
      11,
    ])
  })

  it('collapses the leading gap near the end', () => {
    expect(getPageItems(11, 11)).toEqual([1, 'ellipsis', 9, 10, 11])
  })
})
