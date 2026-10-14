import { en } from '@/i18n/en'
import type { SourceKind } from '@/lib/schemas'

const styles: Record<SourceKind, string> = {
  tech_blog: 'bg-river-soft text-river',
  ielts: 'bg-otter-soft text-otter',
  other: 'bg-paper text-muted border border-line',
}

export function KindBadge({ kind }: { kind: SourceKind }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[kind]}`}>
      {en.kinds[kind]}
    </span>
  )
}
