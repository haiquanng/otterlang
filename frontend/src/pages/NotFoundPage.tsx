import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { en } from '@/i18n/en'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title={en.errors.notFoundTitle}
      body={en.errors.notFoundBody}
      action={{ to: '/', label: en.errors.goHome }}
    />
  )
}
