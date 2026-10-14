import { describe, expect, it } from 'vitest'
import { cambridgeUrl, tagForKind, translateUrl } from '@/lib/tags'

describe('tags', () => {
  it('maps document kinds to tags', () => {
    expect(tagForKind('tech_blog')).toBe('technical')
    expect(tagForKind('ielts')).toBe('ielts')
    expect(tagForKind('other')).toBe('general')
  })

  it('encodes terms in external links', () => {
    expect(cambridgeUrl('Trade-off')).toBe('https://dictionary.cambridge.org/dictionary/english/trade-off')
    expect(translateUrl('reduce latency')).toContain('text=reduce%20latency')
  })
})
