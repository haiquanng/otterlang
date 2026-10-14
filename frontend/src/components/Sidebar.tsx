import { NavLink } from 'react-router'
import { en } from '@/i18n/en'
import { navItems } from '@/lib/nav'

const primaryItems = navItems.filter((item) => item.primary)
const sectionItems = navItems.filter((item) => !item.primary)

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-line bg-surface px-3 py-6 md:flex">
      <div className="mb-6 flex items-center gap-2 px-3">
        <img src="/favicon.svg" alt="" className="size-8" />
        <span className="text-lg font-semibold tracking-tight">{en.appName}</span>
      </div>
      {primaryItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="mb-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-river px-3 text-sm font-semibold text-on-river shadow-sm transition-opacity hover:opacity-90"
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </NavLink>
      ))}
      {sectionItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            [
              'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
              isActive ? 'bg-river-soft text-river' : 'text-muted hover:bg-paper hover:text-ink',
            ].join(' ')
          }
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </NavLink>
      ))}
    </aside>
  )
}
