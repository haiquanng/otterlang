export type Segment = { text: string; match: boolean }

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Split a sentence around whole-word, case-insensitive occurrences of `word`. */
export function highlight(sentence: string, word: string): Segment[] {
  if (!word) return [{ text: sentence, match: false }]
  const pattern = new RegExp(`(?<![A-Za-z])(${escapeRegExp(word)})(?![A-Za-z])`, 'gi')
  const segments: Segment[] = []
  let last = 0
  for (const found of sentence.matchAll(pattern)) {
    const start = found.index
    if (start > last) segments.push({ text: sentence.slice(last, start), match: false })
    segments.push({ text: found[0], match: true })
    last = start + found[0].length
  }
  if (last < sentence.length) segments.push({ text: sentence.slice(last), match: false })
  return segments
}
