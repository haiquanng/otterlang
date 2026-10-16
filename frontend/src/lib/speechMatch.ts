export type MatchedWord = { word: string; heard: boolean }

const normalize = (word: string) => word.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')

/**
 * Which words of the target sentence speech recognition picked up, in order.
 * Longest common subsequence over normalized words, so one misheard word does not
 * shift every word after it. Punctuation stays attached to the displayed word.
 */
export function matchWords(target: string, heard: string): MatchedWord[] {
  const words = target.split(/\s+/).filter(Boolean)
  const a = words.map(normalize)
  const b = heard.split(/\s+/).map(normalize).filter(Boolean)
  const width = b.length + 1
  // lcs[i * width + j]: longest common run of a[i..] and b[j..].
  const lcs = new Array<number>((a.length + 1) * width).fill(0)
  const at = (i: number, j: number) => lcs[i * width + j] ?? 0
  const same = (i: number, j: number) => a[i] !== '' && a[i] === b[j]
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i * width + j] = same(i, j) ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1))
    }
  }
  const result: MatchedWord[] = []
  let j = 0
  for (let i = 0; i < a.length; ) {
    const word = words[i] ?? ''
    if (j < b.length && same(i, j)) {
      result.push({ word, heard: true })
      i++
      j++
    } else if (j < b.length && at(i, j + 1) > at(i + 1, j)) {
      j++
    } else {
      // A bare symbol such as "–" is not spoken, so it never counts as missed.
      result.push({ word, heard: a[i] === '' })
      i++
    }
  }
  return result
}

/** Share of spoken words that were recognized, 0 to 1. */
export function heardShare(words: MatchedWord[]): number {
  const spoken = words.filter((w) => normalize(w.word) !== '')
  return spoken.length === 0 ? 0 : spoken.filter((w) => w.heard).length / spoken.length
}
