import { useQuery } from '@tanstack/react-query'
import { BookOpenText, FileText } from 'lucide-react'
import { Link } from 'react-router'
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
      <PageHeader
        title={en.documents.title}
        body={en.documents.body}
        action={
          <Link
            to="/starter"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-paper"
          >
            <BookOpenText className="size-4" aria-hidden />
            {en.starter.title}
          </Link>
        }
      />
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
            animation="search-file"
            title={en.documents.emptyTitle}
            body={en.documents.emptyBody}
            action={{ to: '/add', label: en.documents.emptyAction }}
          />
          <StarterLibrary limit={4} />
        </div>
      ) : (
        <div className="space-y-10">
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {query.data.map((source) => (
              <li key={source.id}>
                <DocumentCard source={source} />
              </li>
            ))}
          </ul>
          <StarterLibrary limit={4} title={en.starter.moreToRead} />
        </div>
      )}
    </>
  )
}
