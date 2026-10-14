import { describe, expect, it } from 'vitest'
import css from '@/index.css?raw'

/** Read the custom properties of the first block that starts with `selector {`. */
function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`no block for ${selector}`)
  const block = css.slice(start, css.indexOf('}', start))
  return Object.fromEntries([...block.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]))
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

// [text, background, minimum]: 4.5 for body text (WCAG AA).
const pairs: [string, string, number][] = [
  ['ink', 'paper', 4.5],
  ['ink', 'surface', 4.5],
  ['muted', 'paper', 4.5],
  ['muted', 'surface', 4.5],
  ['river', 'paper', 4.5],
  ['river', 'surface', 4.5],
  ['river', 'river-soft', 4.5],
  ['on-river', 'river', 4.5],
  ['otter', 'otter-soft', 4.5],
  ['danger', 'surface', 4.5],
]

describe.each([
  ['light', ':root'],
  ['dark', ":root[data-theme='dark']"],
])('%s theme contrast', (_name, selector) => {
  const palette = { ...tokens(':root'), ...tokens(selector) }

  it.each(pairs)('%s on %s', (text, background, minimum) => {
    expect(ratio(palette[text]!, palette[background]!)).toBeGreaterThanOrEqual(minimum)
  })

  it('cards stand out from the page', () => {
    // Not a text pair, but a white card on the page needs a visible step.
    expect(ratio(palette.surface!, palette.paper!)).toBeGreaterThanOrEqual(1.05)
  })
})

describe('light theme reads comfortably, not just legally', () => {
  // AA alone felt washed out on the warm background (issue #33); aim higher.
  const palette = tokens(':root')

  it('body and secondary text are strong', () => {
    expect(ratio(palette.ink!, palette.paper!)).toBeGreaterThanOrEqual(14)
    expect(ratio(palette.muted!, palette.paper!)).toBeGreaterThanOrEqual(6.5)
    expect(ratio(palette.muted!, palette.surface!)).toBeGreaterThanOrEqual(7)
  })

  it('borders and cards are visible', () => {
    expect(ratio(palette.line!, palette.surface!)).toBeGreaterThanOrEqual(1.3)
    expect(ratio(palette.surface!, palette.paper!)).toBeGreaterThanOrEqual(1.08)
  })

  it('primary actions have strong contrast', () => {
    expect(ratio(palette['on-river']!, palette.river!)).toBeGreaterThanOrEqual(6)
  })
})
