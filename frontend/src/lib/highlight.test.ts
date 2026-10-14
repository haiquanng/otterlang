import { describe, expect, it } from 'vitest'
import { highlight } from '@/lib/highlight'

describe('highlight', () => {
  it('marks whole-word matches case-insensitively', () => {
    expect(highlight('Invalidating a cache. Stop invalidating.', 'invalidating')).toEqual([
      { text: 'Invalidating', match: true },
      { text: ' a cache. Stop ', match: false },
      { text: 'invalidating', match: true },
      { text: '.', match: false },
    ])
  })

  it('does not match inside other words', () => {
    expect(highlight('A cacheable cache', 'cache')).toEqual([
      { text: 'A cacheable ', match: false },
      { text: 'cache', match: true },
    ])
  })

  it('treats regex characters literally', () => {
    expect(highlight('a+b is not ab', 'a+b')[0]).toEqual({ text: 'a+b', match: true })
  })

  it('returns the whole sentence when nothing matches', () => {
    expect(highlight('nothing here', 'cache')).toEqual([{ text: 'nothing here', match: false }])
  })
})
