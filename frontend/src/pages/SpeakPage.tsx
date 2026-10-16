import { useQuery } from '@tanstack/react-query'
import { MessageSquareQuote, RefreshCw } from 'lucide-react'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader } from '@/components/PageHeader'
import { ShadowCard } from '@/components/ShadowCard'
import { en } from '@/i18n/en'
import { getPracticeSentences } from '@/lib/speakingApi'
import { canRecord } from '@/lib/speech'

export function SpeakPage() {
  const query = useQuery({ queryKey: ['speaking'], queryFn: () => getPracticeSentences(), staleTime: Infinity })

  return (
    <>
      <PageHeader
        title={en.speak.title}
        body={en.speak.body}
        action={
          query.data && query.data.length > 0 ? (
            <Button variant="secondary" loading={query.isFetching} onClick={() => void query.refetch()}>
              <RefreshCw className="size-4" aria-hidden />
              {en.speak.newSet}
            </Button>
          ) : null
        }
      />
      {canRecord() ? null : <p className="mb-4 text-sm text-muted">{en.speak.cannotRecord}</p>}
      {query.isPending ? (
        <div className="space-y-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState icon={MessageSquareQuote} title={en.speak.emptyTitle} body={en.speak.emptyBody} action={{ to: '/library', label: en.speak.emptyAction }} />
      ) : (
        <ul className="max-w-3xl space-y-3">
          {query.data.map((item) => (
            <li key={item.id}>
              <ShadowCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
