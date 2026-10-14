import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { en } from '@/i18n/en'
import { applyThemeChoice, readThemeChoice, watchSystemTheme, type ThemeChoice } from '@/lib/theme'

const options: { value: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: en.settings.themeLight, icon: Sun },
  { value: 'dark', label: en.settings.themeDark, icon: Moon },
  { value: 'system', label: en.settings.themeSystem, icon: Monitor },
]

export function ThemePicker() {
  const [choice, setChoice] = useState<ThemeChoice>(readThemeChoice)

  // With "System", keep the browser bar color in step when the OS switches.
  useEffect(() => (choice === 'system' ? watchSystemTheme(() => applyThemeChoice('system')) : undefined), [choice])

  function select(value: ThemeChoice) {
    setChoice(value)
    applyThemeChoice(value)
  }

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <span className="font-medium" id="theme-label">
        {en.settings.theme}
      </span>
      <div role="radiogroup" aria-labelledby="theme-label" className="inline-flex rounded-xl border border-line bg-paper p-1">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={choice === value}
            onClick={() => select(value)}
            className={[
              'flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-river',
              choice === value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
