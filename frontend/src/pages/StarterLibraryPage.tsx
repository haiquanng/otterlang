import { PageHeader } from '@/components/PageHeader'
import { StarterLibrary } from '@/components/StarterLibrary'
import { en } from '@/i18n/en'

export function StarterLibraryPage() {
  return (
    <>
      <PageHeader title={en.starter.title} body={en.starter.body} />
      <StarterLibrary />
    </>
  )
}
