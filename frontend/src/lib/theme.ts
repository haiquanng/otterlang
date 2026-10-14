export const themeChoices = ['light', 'dark', 'system'] as const
export type ThemeChoice = (typeof themeChoices)[number]

// Keep in sync with the inline script in index.html.
const STORAGE_KEY = 'otter-theme'
const THEME_COLOR = { light: '#f3eee5', dark: '#15171a' } as const
const DARK_QUERY = '(prefers-color-scheme: dark)'

function isChoice(value: unknown): value is ThemeChoice {
  return typeof value === 'string' && (themeChoices as readonly string[]).includes(value)
}

export function readThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isChoice(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function resolveTheme(choice: ThemeChoice, systemDark: boolean): 'light' | 'dark' {
  if (choice === 'system') return systemDark ? 'dark' : 'light'
  return choice
}

export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
}

/** Apply a choice to the document (data-theme + browser bar color) and remember it. */
export function applyThemeChoice(choice: ThemeChoice): void {
  const root = document.documentElement
  if (choice === 'system') delete root.dataset.theme
  else root.dataset.theme = choice
  const effective = resolveTheme(choice, systemPrefersDark())
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[effective])
  try {
    if (choice === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    // Private mode or blocked storage: the choice still applies for this visit.
  }
}

export function watchSystemTheme(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
