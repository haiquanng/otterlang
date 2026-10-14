import { AccountCard } from '@/components/AccountCard'
import { PageHeader } from '@/components/PageHeader'
import { ServerStatus } from '@/components/ServerStatus'
import { en } from '@/i18n/en'

export function SettingsPage() {
  return (
    <>
      <PageHeader title={en.settings.title} />
      <div className="space-y-3">
        <AccountCard />
        <ServerStatus />
      </div>
    </>
  )
}
