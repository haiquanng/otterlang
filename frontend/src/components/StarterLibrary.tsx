import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { ErrorState } from '@/components/ErrorState'
import { StarterCard } from '@/components/StarterCard'
import { en } from '@/i18n/en'
import { listLibraryDocuments } from '@/lib/libraryApi'
import { sourceKinds, type SourceKind } from '@/lib/schemas'

type Props = {
  /**
   * Preview mode (Today, Documents): only texts the learner has not opened yet, a few at a
   * time, with a link to the full library. Hidden entirely once everything is opened.
   */
  limit?: number
  title?: string
}

const filterKinds = sourceKinds.filter((kind) => kind !== 'other')

export function StarterLibrary({ limit, title = en.starter.sectionTitle }: Props) {
  const [kind, setKind] = useState<SourceKind | undefined>()
  const query = useQuery({ queryKey: ['library-documents', kind ?? 'all'], queryFn: () => listLibraryDocuments(kind) })
  const all = query.data ?? []
  // Opened texts already live in Documents; a preview only suggests new ones.
  const docs = limit ? all.filter((doc) => doc.source_id === null).slice(0, limit) : all

  if (limit && query.isSuccess && docs.length === 0) return null

  return (
    <section>
      {limit ? (
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">{title}</h2>
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
