import { AccountCard } from '@/components/AccountCard'
import { DailyGoalPicker } from '@/components/DailyGoalPicker'
import { PageHeader } from '@/components/PageHeader'
import { ThemePicker } from '@/components/ThemePicker'
import { en } from '@/i18n/en'

export function SettingsPage() {
  return (
    <>
      <PageHeader title={en.settings.title} />
      <div className="max-w-3xl space-y-3">
        <AccountCard />
        <DailyGoalPicker />
        <ThemePicker />
      </div>
    </>
  )
}
