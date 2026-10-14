import { useEffect } from 'react'
import { en } from '@/i18n/en'
import type { Rating } from '@/lib/reviewApi'

const ratings: { value: Rating; label: string; style: string }[] = [
  { value: 1, label: en.review.again, style: 'text-danger' },
  { value: 2, label: en.review.hard, style: 'text-otter' },
  { value: 3, label: en.review.good, style: 'text-river' },
  { value: 4, label: en.review.easy, style: 'text-river' },
]

type Props = {
  suggested: Rating
  disabled: boolean
  onRate: (rating: Rating) => void
}

/** Keys 1-4 rate; Enter takes the suggestion. */
export function RatingButtons({ suggested, disabled, onRate }: Props) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (disabled || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'Enter') {
        event.preventDefault()
        onRate(suggested)
      } else if (['1', '2', '3', '4'].includes(event.key)) {
        onRate(Number(event.key) as Rating)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [disabled, onRate, suggested])

  return (
    <div>
      <p className="mb-2 text-sm text-muted">{en.review.howWasIt}</p>
      <div className="grid grid-cols-4 gap-2">
        {ratings.map(({ value, label, style }) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onRate(value)}
            aria-keyshortcuts={String(value)}
            className={[
              'flex min-h-14 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition',
              'focus-visible:outline-2 focus-visible:outline-river disabled:opacity-60',
              value === suggested ? 'border-river bg-river-soft ring-2 ring-river/30' : 'border-line bg-surface hover:bg-paper',
              style,
            ].join(' ')}
          >
            {label}
            <span className="hidden text-xs font-normal text-muted md:block">{value}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
