import { CalendarCheck, PartyPopper, X } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { ReviewPrompt } from '@/components/ReviewPrompt'
import { ReviewResult } from '@/components/ReviewResult'
import { useReviewSession } from '@/hooks/useReviewSession'
import { en } from '@/i18n/en'

/** Focused, full-screen session: no navigation chrome while answering. */
export function ReviewPage() {
  const session = useReviewSession()
  const total = session.cards.length
  const progress = total ? Math.min(session.index, total) / total : 0

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-4 px-4">
          <Link to="/" aria-label={en.review.exit} className="-ml-2 flex size-11 items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-ink">
            <X className="size-5" aria-hidden />
          </Link>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={session.index}>
            <div className="h-full rounded-full bg-river transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="w-14 text-right text-sm tabular-nums text-muted">
            {total ? `${Math.min(session.index + 1, total)} / ${total}` : ''}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        {session.error ? (
          <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {en.review.saveError}
          </p>
        ) : null}

        {session.query.isPending ? (
          <div className="space-y-4" aria-busy>
            <div className="h-6 w-32 animate-pulse rounded bg-surface" />
            <div className="h-24 animate-pulse rounded-2xl bg-surface" />
          </div>
        ) : session.query.isError ? (
          <ErrorState onRetry={() => void session.query.refetch()} />
        ) : total === 0 ? (
          <EmptyState icon={CalendarCheck} title={en.review.nothingTitle} body={en.review.nothingBody} action={{ to: '/library', label: en.review.nothingAction }} />
        ) : session.finished ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <EmptyState icon={PartyPopper} title={en.review.doneTitle} body={en.review.doneBody(total, session.correctCount)} action={{ to: '/', label: en.review.backToday }} />
            <Button variant="secondary" onClick={() => void session.restart()}>
              {en.review.checkMore}
            </Button>
          </div>
        ) : session.card && session.result && (session.phase === 'result' || session.phase === 'saving') ? (
          <ReviewResult result={session.result} saving={session.phase === 'saving'} onRate={(r) => void session.rate(r)} />
        ) : session.card ? (
          <ReviewPrompt key={session.card.id} card={session.card} busy={session.phase === 'checking'} onShown={session.startTimer} onCheck={(a) => void session.check(a)} />
        ) : null}
      </main>
    </div>
  )
}
