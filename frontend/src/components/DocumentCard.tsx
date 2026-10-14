import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { KindBadge } from '@/components/KindBadge'
import { en } from '@/i18n/en'
import { formatDate, readingMinutes } from '@/lib/format'
import type { SourceSummary } from '@/lib/schemas'

export function DocumentCard({ source }: { source: SourceSummary }) {
  return (
    <Link
      to={`/documents/${source.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-4 transition hover:border-river/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-river"
    >
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold">{source.title}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <KindBadge kind={source.kind} />
          <span>{en.documents.minutes(readingMinutes(source.char_count))}</span>
          <span>{formatDate(source.created_at)}</span>
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}
