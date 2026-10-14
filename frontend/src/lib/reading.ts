export type Token = { text: string; word: boolean; start: number }

// Same word shape as the backend (letters, inner apostrophes or hyphens).
const WORD = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g
const SENTENCE_END = /[.!?](?=\s)|\n/g

/** Split text into word and non-word runs, keeping offsets into the original string. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  for (const match of text.matchAll(WORD)) {
    if (match.index > last) tokens.push({ text: text.slice(last, match.index), word: false, start: last })
    tokens.push({ text: match[0], word: true, start: match.index })
    last = match.index + match[0].length
  }
  if (last < text.length) tokens.push({ text: text.slice(last), word: false, start: last })
  return tokens
}

/** The sentence containing the character at `offset`, trimmed. */
export function sentenceAt(text: string, offset: number): string {
  let start = 0
  let end = text.length
  for (const match of text.matchAll(SENTENCE_END)) {
    const boundary = match.index + 1
    if (boundary <= offset) start = boundary
    else {
      end = boundary
      break
    }
  }
  return text.slice(start, end).trim()
}

/** Paragraphs with their offset in the full text, so word offsets stay global. */
export function paragraphs(text: string): { text: string; start: number }[] {
  const result: { text: string; start: number }[] = []
  let offset = 0
  for (const part of text.split(/(\n+)/)) {
    if (part.trim() && !part.startsWith('\n')) result.push({ text: part, start: offset })
    offset += part.length
  }
  return result
}

export function normalizeSurface(word: string): string {
  return word.toLowerCase().replace(/’/g, "'")
}
