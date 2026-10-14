const WORDS_PER_MINUTE = 200
const AVERAGE_CHARS_PER_WORD = 6

/** Rough reading time from a character count; never below one minute. */
export function readingMinutes(charCount: number): number {
  return Math.max(1, Math.round(charCount / AVERAGE_CHARS_PER_WORD / WORDS_PER_MINUTE))
}

const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

/** UTC timestamp from the API, shown in the viewer's own timezone. */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}
