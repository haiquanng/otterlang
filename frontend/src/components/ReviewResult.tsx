import { CircleAlert, CircleCheck, CircleX } from 'lucide-react'
import { HighlightedSentence } from '@/components/HighlightedSentence'
import { RatingButtons } from '@/components/RatingButtons'
import { WordLookup } from '@/components/WordLookup'
import { en } from '@/i18n/en'
import type { CheckResult, Rating } from '@/lib/reviewApi'

type Props = {
  result: CheckResult
  saving: boolean
  onRate: (rating: Rating) => void
}

export function ReviewResult({ result, saving, onRate }: Props) {
  const [Icon, label, tone] = result.correct
    ? [CircleCheck, en.review.correct, 'bg-river-soft text-river']
    : result.close
      ? [CircleAlert, en.review.almost, 'bg-otter-soft text-otter']
      : [CircleX, en.review.notQuite, 'bg-danger/10 text-danger']

  return (
    <div className="space-y-6">
      <div role="status" className={`flex items-center gap-2 rounded-xl px-4 py-3 font-semibold ${tone}`}>
        <Icon className="size-5" aria-hidden />
        {label}
      </div>
      <div>
        <p className="text-3xl font-semibold tracking-tight">{result.expected}</p>
        {result.definition ? <p className="mt-2 text-ink/80">{result.definition}</p> : null}
      </div>
      {result.sentence ? (
        <HighlightedSentence sentence={result.sentence} word={result.expected} className="rounded-xl bg-surface px-4 py-3 text-lg" />
      ) : null}
      <WordLookup term={result.expected} />
      <RatingButtons suggested={result.suggested_rating as Rating} disabled={saving} onRate={onRate} />
    </div>
  )
}
