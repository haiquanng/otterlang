import { describe, expect, it } from 'vitest'
import { formatDate, readingMinutes } from '@/lib/format'

describe('readingMinutes', () => {
  it('never goes below one minute', () => {
    expect(readingMinutes(0)).toBe(1)
    expect(readingMinutes(300)).toBe(1)
  })

  it('scales with length', () => {
    expect(readingMinutes(12_000)).toBe(10)
  })
})

describe('formatDate', () => {
  it('includes the year', () => {
    expect(formatDate('2026-10-14T03:00:00Z')).toContain('2026')
  })
})
