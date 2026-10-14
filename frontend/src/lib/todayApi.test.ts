import { describe, expect, it } from 'vitest'
import { dayPart } from '@/lib/todayApi'

describe('dayPart', () => {
  it('splits the day at noon and 6 pm', () => {
    expect(dayPart(0)).toBe('morning')
    expect(dayPart(11)).toBe('morning')
    expect(dayPart(12)).toBe('afternoon')
    expect(dayPart(17)).toBe('afternoon')
    expect(dayPart(18)).toBe('evening')
  })
})
