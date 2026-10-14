import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { ErrorState } from '@/components/ErrorState'
import { StarterCard } from '@/components/StarterCard'
import { en } from '@/i18n/en'
import { listLibraryDocuments } from '@/lib/libraryApi'
import { sourceKinds, type SourceKind } from '@/lib/schemas'

type Props = {
  /** Show only the first few, with a link to the full library (used on Today and Documents). */
  limit?: number
}

const filterKinds = sourceKinds.filter((kind) => kind !== 'other')

export function StarterLibrary({ limit }: Props) {
  const [kind, setKind] = useState<SourceKind | undefined>()
  const query = useQuery({ queryKey: ['library-documents', kind ?? 'all'], queryFn: () => listLibraryDocuments(kind) })
  // In preview mode, texts the learner has not opened yet come first.
  const docs = (query.data ?? [])
    .toSorted((a, b) => (limit ? Number(a.source_id !== null) - Number(b.source_id !== null) : 0))
    .slice(0, limit)

  return (
    <section>
      {limit ? (
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">{en.starter.sectionTitle}</h2>
          <Link to="/starter" className="text-sm font-medium text-river hover:underline">
            {en.starter.browseAll}
          </Link>
        </div>
      ) : (
        <div className="mb-4 flex gap-2" role="group" aria-label={en.add.kindLabel}>
          {[undefined, ...filterKinds].map((option) => (
            <button
              key={option ?? 'all'}
              type="button"
              aria-pressed={kind === option}
              onClick={() => setKind(option)}
              className={`min-h-9 rounded-full border px-4 text-sm font-medium ${kind === option ? 'border-river bg-river text-on-river' : 'border-line bg-surface text-muted hover:text-ink'}`}
            >
              {option ? en.kinds[option] : en.library.all}
            </button>
          ))}
        </div>
      )}

      {query.isPending ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy>
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-40 animate-pulse rounded-2xl bg-surface" />
          ))}
        </ul>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : docs.length === 0 ? (
        <p className="py-6 text-muted">{en.starter.empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {docs.map((doc) => (
            <li key={doc.id}>
              <StarterCard doc={doc} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
