import { en } from '@/i18n/en'
import { tags, type Tag } from '@/lib/schemas'

type Props = {
  value: Tag | undefined
  onChange: (tag: Tag | undefined) => void
}

export function TagFilter({ value, onChange }: Props) {
  const options: { tag: Tag | undefined; label: string }[] = [
    { tag: undefined, label: en.library.all },
    ...tags.map((tag) => ({ tag, label: en.tags[tag] })),
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={en.item.tags}>
      {options.map(({ tag, label }) => {
        const active = value === tag
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tag)}
            className={[
              'min-h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-river',
              active ? 'border-river bg-river text-on-river' : 'border-line bg-surface text-muted hover:text-ink',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
