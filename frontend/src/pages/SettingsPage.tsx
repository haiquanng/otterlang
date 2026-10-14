import { PageHeader } from '@/components/PageHeader'
import { ServerStatus } from '@/components/ServerStatus'
import { en } from '@/i18n/en'

export function SettingsPage() {
  return (
    <>
      <PageHeader title={en.settings.title} />
      <ServerStatus />
    </>
  )
}
