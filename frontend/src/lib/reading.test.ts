import { describe, expect, it } from 'vitest'
import { normalizeSurface, paragraphs, sentenceAt, tokenize } from '@/lib/reading'

describe('tokenize', () => {
  it('splits words from punctuation and keeps offsets', () => {
    expect(tokenize('Cache, trade-off!')).toEqual([
      { text: 'Cache', word: true, start: 0 },
      { text: ', ', word: false, start: 5 },
      { text: 'trade-off', word: true, start: 7 },
      { text: '!', word: false, start: 16 },
    ])
  })

  it('treats numbers and symbols as non-words', () => {
    expect(tokenize('v2 at 50%').filter((t) => t.word).map((t) => t.text)).toEqual(['v', 'at'])
  })
})

describe('sentenceAt', () => {
  const text = 'Caching helps. Invalidating a cache is hard!\nNew line here.'

  it('returns the sentence around an offset', () => {
    expect(sentenceAt(text, text.indexOf('Invalidating'))).toBe('Invalidating a cache is hard!')
    expect(sentenceAt(text, 2)).toBe('Caching helps.')
  })

  it('stops at line breaks', () => {
    expect(sentenceAt(text, text.indexOf('New'))).toBe('New line here.')
  })
})

describe('paragraphs', () => {
  it('keeps global offsets', () => {
    const text = 'One.\n\nTwo here.'
    expect(paragraphs(text)).toEqual([
      { text: 'One.', start: 0 },
      { text: 'Two here.', start: 6 },
    ])
  })
})

describe('normalizeSurface', () => {
  it('lowercases and straightens apostrophes', () => {
    expect(normalizeSurface('Don’t')).toBe("don't")
  })
})
