/** Share of the daily goal done, between 0 and 1. */
export function goalFraction(reviewed: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(1, Math.max(0, reviewed / goal))
}

/** Bar heights as a share of the busiest day (an all-zero week stays flat). */
export function barFractions(values: number[]): number[] {
  const max = Math.max(0, ...values)
  return values.map((v) => (max === 0 ? 0 : v / max))
}

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'narrow', timeZone: 'UTC' })

/** One-letter weekday for an ISO date (YYYY-MM-DD), independent of the viewer's offset. */
export function weekdayLetter(isoDate: string): string {
  return weekday.format(new Date(`${isoDate}T00:00:00Z`))
}
