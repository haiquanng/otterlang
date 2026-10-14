import { Link } from 'react-router'
import { en } from '@/i18n/en'
import type { Item } from '@/lib/schemas'

export function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      to={`/library/${item.id}`}
      className="block rounded-2xl border border-line bg-surface px-4 py-3.5 transition hover:border-river/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-river"
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="font-semibold">{item.term}</h2>
        {item.type !== 'word' ? <span className="text-xs text-muted">{en.library.phrase}</span> : null}
        <span className="ml-auto flex gap-1">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
              {en.tags[tag]}
            </span>
          ))}
        </span>
      </div>
      <p className={`mt-1 line-clamp-2 text-sm ${item.definition ? 'text-ink/80' : 'italic text-muted'}`}>
        {item.definition ?? en.library.noDefinition}
      </p>
    </Link>
  )
}
