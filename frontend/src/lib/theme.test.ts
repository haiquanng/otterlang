import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyThemeChoice, readThemeChoice, resolveTheme } from '@/lib/theme'

describe('theme', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="theme-color" content="#f3eee5" />'
  })
  afterEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('defaults to system and ignores unknown stored values', () => {
    expect(readThemeChoice()).toBe('system')
    localStorage.setItem('otter-theme', 'neon')
    expect(readThemeChoice()).toBe('system')
  })

  it('resolves system from the OS preference', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('applies and remembers an explicit choice', () => {
    applyThemeChoice('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#15171a')
    expect(readThemeChoice()).toBe('dark')
  })

  it('system removes the override and the stored choice', () => {
    applyThemeChoice('light')
    applyThemeChoice('system')
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(localStorage.getItem('otter-theme')).toBeNull()
  })
})
