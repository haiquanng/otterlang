import { BookOpen, FileText, Plus, Settings, Sun, type LucideIcon } from 'lucide-react'
import { en } from '@/i18n/en'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  primary?: boolean
}

// Order matters: the mobile tab bar puts the primary action in the middle.
export const navItems: NavItem[] = [
  { to: '/', label: en.nav.today, icon: Sun },
  { to: '/library', label: en.nav.library, icon: BookOpen },
  { to: '/add', label: en.nav.add, icon: Plus, primary: true },
  { to: '/documents', label: en.nav.documents, icon: FileText },
  { to: '/settings', label: en.nav.settings, icon: Settings },
]
