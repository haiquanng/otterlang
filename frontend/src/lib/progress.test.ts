import { describe, expect, it } from 'vitest'
import { barFractions, goalFraction, weekdayLetter } from '@/lib/progress'

describe('goalFraction', () => {
  it('clamps between 0 and 1', () => {
    expect(goalFraction(5, 20)).toBe(0.25)
    expect(goalFraction(30, 20)).toBe(1)
    expect(goalFraction(3, 0)).toBe(0)
  })
})

describe('barFractions', () => {
  it('scales to the busiest day', () => {
    expect(barFractions([0, 5, 10])).toEqual([0, 0.5, 1])
    expect(barFractions([0, 0])).toEqual([0, 0])
  })
})

describe('weekdayLetter', () => {
  it('depends only on the calendar date', () => {
    expect(weekdayLetter('2026-10-15')).toBe(weekdayLetter('2026-10-22'))
    expect(weekdayLetter('2026-10-15')).toHaveLength(1)
  })
})
