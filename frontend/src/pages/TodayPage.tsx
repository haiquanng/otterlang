import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { DocumentCard } from '@/components/DocumentCard'
import { ErrorState } from '@/components/ErrorState'
import { QuickAdd } from '@/components/QuickAdd'
import { StarterLibrary } from '@/components/StarterLibrary'
import { TodayHero } from '@/components/TodayHero'
import { useSession } from '@/hooks/useSession'
import { en } from '@/i18n/en'
import { dayPart, getToday } from '@/lib/todayApi'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}

export function TodayPage() {
  const session = useSession()
  const query = useQuery({ queryKey: ['today'], queryFn: getToday })
  const name = session.status === 'signed-in' ? session.user.display_name : null
  // Read the clock once per visit so the greeting does not flip between renders.
  const [part] = useState(() => dayPart(new Date().getHours()))

  return (
    <>
      <header className="mb-6">
        <p className="text-sm text-muted">{en.today.title}</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {en.today.greeting(part, name)}
        </h1>
      </header>

      {query.isPending ? (
        <div className="h-48 animate-pulse rounded-3xl bg-surface" aria-busy />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : (
        <div className="space-y-8">
          {/* Desktop: the next action on the left, what you are reading on the right. */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="space-y-6">
              <TodayHero today={query.data} />
              {query.data.total_words > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  <Stat label={en.today.totalWords} value={query.data.total_words} />
                  <Stat label={en.today.newThisWeek} value={query.data.new_this_week} />
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <section>
                <h2 className="mb-2 text-sm font-medium text-muted">{en.today.quickAdd}</h2>
                <QuickAdd />
              </section>
              {query.data.recent_documents.length > 0 ? (
                <section>
                  <div className="mb-2 flex items-baseline justify-between">
                    <h2 className="text-sm font-medium text-muted">{en.today.recent}</h2>
                    <Link to="/documents" className="text-sm font-medium text-river hover:underline">
                      {en.today.allDocuments}
                    </Link>
                  </div>
                  <ul className="space-y-2">
                    {query.data.recent_documents.map((source) => (
                      <li key={source.id}>
                        <DocumentCard source={source} />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </div>

          {/* A new learner needs something to read before anything else makes sense. */}
          {query.data.recent_documents.length === 0 ? <StarterLibrary limit={4} /> : null}
        </div>
      )}
    </>
  )
}
