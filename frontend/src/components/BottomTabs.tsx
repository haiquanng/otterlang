import { NavLink } from 'react-router'
import { navItems } from '@/lib/nav'

export function BottomTabs() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {navItems.map(({ to, label, icon: Icon, primary }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              aria-label={label}
              className={({ isActive }) =>
                [
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                  isActive ? 'text-river' : 'text-muted',
                ].join(' ')
              }
            >
              {primary ? (
                <span className="flex size-11 items-center justify-center rounded-full bg-river text-white shadow-sm">
                  <Icon className="size-6" aria-hidden />
                </span>
              ) : (
                <>
                  <Icon className="size-6" aria-hidden />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
