import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { DocumentCard } from '@/components/DocumentCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader } from '@/components/PageHeader'
import { StarterLibrary } from '@/components/StarterLibrary'
import { en } from '@/i18n/en'
import { listSources } from '@/lib/api'

export function DocumentsPage() {
  const query = useQuery({ queryKey: ['sources'], queryFn: listSources })

  return (
    <>
      <PageHeader title={en.documents.title} body={en.documents.body} />
      {query.isPending ? (
        <ul className="space-y-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
          ))}
        </ul>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <div className="space-y-8">
          <EmptyState
            icon={FileText}
            title={en.documents.emptyTitle}
            body={en.documents.emptyBody}
            action={{ to: '/add', label: en.documents.emptyAction }}
          />
          <StarterLibrary limit={4} />
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {query.data.map((source) => (
            <li key={source.id}>
              <DocumentCard source={source} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
