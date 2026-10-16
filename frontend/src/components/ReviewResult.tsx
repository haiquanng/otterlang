import { CircleAlert, CircleCheck, CircleX } from 'lucide-react'
import { AiFeedback } from '@/components/AiFeedback'
import { HighlightedSentence } from '@/components/HighlightedSentence'
import { RatingButtons } from '@/components/RatingButtons'
import { WordLookup } from '@/components/WordLookup'
import { en } from '@/i18n/en'
import type { CheckResult, Rating } from '@/lib/reviewApi'
import { feedbackMessages } from '@/lib/sentenceFeedback'

type Props = {
  result: CheckResult
  saving: boolean
  onRate: (rating: Rating) => void
  /** Writing card: the sentence is the learner's own, and feedback is advice, not right/wrong. */
  writing?: boolean
  cardId: string
}

export function ReviewResult({ result, saving, onRate, writing = false, cardId }: Props) {
  const advice = feedbackMessages(result.issues)
  const [Icon, label, tone] = result.correct
    ? [CircleCheck, writing ? en.review.goodSentence : en.review.correct, 'bg-river-soft text-river']
    : writing
      ? [CircleAlert, en.review.couldBeBetter, 'bg-otter-soft text-otter']
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
        <div>
          {writing ? <p className="mb-1 text-sm font-medium text-muted">{en.review.yourSentence}</p> : null}
          <HighlightedSentence sentence={result.sentence} word={result.expected} className="rounded-xl bg-surface px-4 py-3 text-lg" />
        </div>
      ) : null}
      {advice.length > 0 ? (
        <ul className="space-y-1 text-sm text-ink/85">
          {advice.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span aria-hidden>•</span>
              {tip}
            </li>
          ))}
        </ul>
      ) : null}
      {writing && result.sentence ? <AiFeedback cardId={cardId} sentence={result.sentence} /> : null}
      <WordLookup term={result.expected} />
      <RatingButtons suggested={result.suggested_rating as Rating} disabled={saving} onRate={onRate} />
    </div>
  )
}
