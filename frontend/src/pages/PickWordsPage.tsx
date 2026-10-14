import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, PartyPopper, SearchX } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/Button'
import { CandidateRow } from '@/components/CandidateRow'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { UndoToast } from '@/components/UndoToast'
import { usePickWords } from '@/hooks/usePickWords'
import { en } from '@/i18n/en'
import { getSource } from '@/lib/api'
import { tagForKind } from '@/lib/tags'

export function PickWordsPage() {
  const { id = '' } = useParams()
  const source = useQuery({ queryKey: ['sources', id], queryFn: () => getSource(id) })
  const pick = usePickWords(id)
  const tag = tagForKind(source.data?.kind ?? 'other')

  return (
    <>
      <Link
        to={`/documents/${id}`}
        className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {en.pick.back}
      </Link>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{en.pick.title}</h1>
          <p className="mt-1 truncate text-muted">{source.data?.title ?? ' '}</p>
        </div>
        {pick.remaining.length > 0 ? (
          <div className="flex items-center gap-3">
            <span className="text-sm tabular-nums text-muted">{en.pick.left(pick.remaining.length)}</span>
            <Button variant="secondary" onClick={pick.knowTheRest}>
              {en.pick.markRestKnown}
            </Button>
          </div>
        ) : null}
      </header>

      {pick.error ? (
        <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {en.pick.actionError}
        </p>
      ) : null}

      {pick.query.isPending ? (
        <ul className="space-y-3" aria-busy>
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-28 animate-pulse rounded-2xl bg-surface" />
          ))}
        </ul>
      ) : pick.query.isError ? (
        <ErrorState onRetry={() => void pick.query.refetch()} />
      ) : pick.total === 0 ? (
        <EmptyState icon={SearchX} title={en.pick.noneTitle} body={en.pick.noneBody} />
      ) : pick.remaining.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title={en.pick.doneTitle}
          body={en.pick.doneBody}
          action={{ to: '/documents', label: en.pick.doneAction }}
        />
      ) : (
        <ul className="max-w-4xl space-y-3">
          {pick.remaining.map((candidate) => (
            <li key={candidate.lemma}>
              <CandidateRow
                candidate={candidate}
                onSave={() => pick.save(candidate, tag)}
                onKnown={() => pick.known(candidate)}
                onSkip={() => pick.skip(candidate)}
              />
            </li>
          ))}
        </ul>
      )}

      <UndoToast toast={pick.toast} onDismiss={pick.dismissToast} />
    </>
  )
}
