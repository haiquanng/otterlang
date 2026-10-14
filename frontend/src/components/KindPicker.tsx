import { en } from '@/i18n/en'
import { sourceKinds, type SourceKind } from '@/lib/schemas'

type Props = {
  label: string
  value: SourceKind
  onChange: (kind: SourceKind) => void
}

export function KindPicker({ label, value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="inline-flex rounded-xl border border-line bg-surface p-1">
        {sourceKinds.map((kind) => (
          <label
            key={kind}
            className={[
              'flex min-h-10 cursor-pointer items-center rounded-lg px-4 text-sm font-medium transition-colors',
              'has-focus-visible:outline-2 has-focus-visible:outline-river',
              value === kind ? 'bg-river-soft text-river' : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            <input
              type="radio"
              name="kind"
              value={kind}
              checked={value === kind}
              onChange={() => onChange(kind)}
              className="sr-only"
            />
            {en.kinds[kind]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
