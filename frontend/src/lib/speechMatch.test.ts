import { describe, expect, it } from 'vitest'
import { heardShare, matchWords } from '@/lib/speechMatch'

const heardFlags = (target: string, heard: string) => matchWords(target, heard).map((w) => w.heard)

describe('matchWords', () => {
  it('marks every word when the sentence is heard exactly, ignoring case and punctuation', () => {
    expect(heardFlags('We invalidate the cache.', 'we invalidate the cache')).toEqual([true, true, true, true])
  })

  it('keeps the displayed word with its punctuation', () => {
    expect(matchWords('Hello, world!', 'hello world').map((w) => w.word)).toEqual(['Hello,', 'world!'])
  })

  it('does not shift later words after one misheard word', () => {
    expect(heardFlags('Our system is resilient today', 'our system his resilient today')).toEqual([
      true,
      true,
      false,
      true,
      true,
    ])
  })

  it('skips extra words the recognizer added', () => {
    expect(heardFlags('Ship it now', 'ship uh it right now')).toEqual([true, true, true])
  })

  it('marks everything missed when nothing was heard', () => {
    expect(heardFlags('Ship it now', '')).toEqual([false, false, false])
  })

  it('treats curly and straight apostrophes alike', () => {
    expect(heardFlags('It’s fine', "it's fine")).toEqual([true, true])
  })

  it('never counts a bare dash as missed', () => {
    expect(heardFlags('Fast – and safe', 'fast and safe')).toEqual([true, true, true, true])
  })
})

describe('heardShare', () => {
  it('ignores bare symbols in the total', () => {
    expect(heardShare(matchWords('Fast – and safe', 'fast safe'))).toBeCloseTo(2 / 3)
  })

  it('is zero for an empty sentence', () => {
    expect(heardShare([])).toBe(0)
  })
})
