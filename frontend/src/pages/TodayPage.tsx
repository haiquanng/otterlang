import { PageHeader } from '@/components/PageHeader'
import { en } from '@/i18n/en'

export function TodayPage() {
  return <PageHeader title={en.today.title} body={en.today.body} />
}
