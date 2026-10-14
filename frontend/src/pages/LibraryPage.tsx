import { useQuery } from '@tanstack/react-query'
import { BookOpen, Search } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { ItemCard } from '@/components/ItemCard'
import { PageHeader } from '@/components/PageHeader'
import { QuickAdd } from '@/components/QuickAdd'
import { TagFilter } from '@/components/TagFilter'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { en } from '@/i18n/en'
import { listItems } from '@/lib/api'
import type { Tag } from '@/lib/schemas'

export function LibraryPage() {
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState<Tag | undefined>()
  const q = useDebouncedValue(search.trim(), 250)
  const query = useQuery({
    queryKey: ['items', { q, tag }],
    queryFn: () => listItems({ q, tag }),
    placeholderData: (previous) => previous,
  })
  const filtering = q !== '' || tag !== undefined

  return (
    <>
      <PageHeader title={en.library.title} body={en.library.body} />
      <QuickAdd />

      <div className="mt-6 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={en.library.search}
            aria-label={en.library.search}
            className="h-11 w-full rounded-xl border border-line bg-surface pr-4 pl-11 text-base placeholder:text-muted/70 focus:border-river focus:outline-none focus:ring-3 focus:ring-river/20"
          />
        </div>
        <TagFilter value={tag} onChange={setTag} />
      </div>

      <div className="mt-4">
        {query.isPending ? (
          <ul className="space-y-2" aria-busy>
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="h-[72px] animate-pulse rounded-2xl bg-surface" />
            ))}
          </ul>
        ) : query.isError ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : query.data.length === 0 ? (
          filtering ? (
            <p className="py-10 text-center text-muted">{en.library.noResults}</p>
          ) : (
            <EmptyState
              icon={BookOpen}
              animation="books"
              title={en.library.emptyTitle}
              body={en.library.emptyBody}
              action={{ to: '/add', label: en.library.emptyAction }}
            />
          )
        ) : (
          <ul className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
            {query.data.map((item) => (
              <li key={item.id}>
                <ItemCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
