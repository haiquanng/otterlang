import { BookOpen, BookOpenText, FileText, Mic, Plus, Settings, Sun, type LucideIcon } from 'lucide-react'
import { en } from '@/i18n/en'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  primary?: boolean
  /** Sidebar only: the mobile tab bar has room for five items. */
  desktopOnly?: boolean
}

// Order matters: the mobile tab bar puts the primary action in the middle.
export const navItems: NavItem[] = [
  { to: '/', label: en.nav.today, icon: Sun },
  { to: '/library', label: en.nav.library, icon: BookOpen },
  { to: '/add', label: en.nav.add, icon: Plus, primary: true },
  { to: '/documents', label: en.nav.documents, icon: FileText },
  { to: '/starter', label: en.nav.starter, icon: BookOpenText, desktopOnly: true },
  { to: '/speak', label: en.nav.speak, icon: Mic, desktopOnly: true },
  { to: '/settings', label: en.nav.settings, icon: Settings },
]
