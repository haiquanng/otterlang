import { useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { en } from '@/i18n/en'
import { getWritingFeedback } from '@/lib/aiApi'
import { ApiError } from '@/lib/api'

type Props = { cardId: string; sentence: string }

/** Optional AI advice under the writing checks. Never blocks rating; hidden when AI is off. */
export function AiFeedback({ cardId, sentence }: Props) {
  const feedback = useQuery({
    queryKey: ['ai-feedback', cardId, sentence],
    queryFn: () => getWritingFeedback(cardId, sentence),
    retry: false,
    staleTime: Infinity,
  })

  if (feedback.error instanceof ApiError && feedback.error.status === 404) return null
  const unchanged = feedback.data && feedback.data.natural_version.trim() === sentence.trim()

  return (
    <section aria-live="polite" className="rounded-xl border border-line px-4 py-3">
      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted">
        <Sparkles className="size-4" aria-hidden />
        {en.review.aiTitle}
      </p>
      {feedback.isPending ? <p className="text-sm text-muted">{en.review.aiLoading}</p> : null}
      {feedback.isError ? (
        <p className="text-sm text-muted">
          {feedback.error instanceof ApiError && feedback.error.status === 429 ? en.review.aiLimit : en.review.aiUnavailable}
        </p>
      ) : null}
      {feedback.data ? (
        <div className="space-y-2">
          <p className={`text-sm font-medium ${feedback.data.word_used_correctly ? 'text-river' : 'text-otter'}`}>
            {feedback.data.word_used_correctly ? en.review.aiWordRight : en.review.aiWordWrong}
          </p>
          {unchanged ? null : (
            <div>
              <p className="text-sm text-muted">{en.review.aiNatural}</p>
              <p className="text-ink">{feedback.data.natural_version}</p>
            </div>
          )}
          <p className="text-sm text-ink/85">{feedback.data.tip}</p>
        </div>
      ) : null}
    </section>
  )
}
