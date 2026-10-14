import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/Button'
import { en } from '@/i18n/en'
import type { ReviewCard } from '@/lib/reviewApi'

const BLANK = '_____'

function ClozeText({ text }: { text: string }) {
  const parts = text.split(BLANK)
  return (
    <p className="font-reading text-xl leading-relaxed md:text-2xl">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 ? (
            <span className="mx-1 inline-block w-24 border-b-2 border-river align-baseline" aria-label={en.review.blank} />
          ) : null}
        </span>
      ))}
    </p>
  )
}

type Props = {
  card: ReviewCard
  busy: boolean
  onShown: () => void
  onCheck: (answer: string) => void
}

export function ReviewPrompt({ card, busy, onShown, onCheck }: Props) {
  const [answer, setAnswer] = useState('')
  const [showHint, setShowHint] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    onShown()
    input.current?.focus()
  }, [card.id, onShown])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    onCheck(answer)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-sm font-medium uppercase tracking-wide text-muted">
        {card.card_type === 'cloze' ? en.review.fillGap : en.review.whichWord}
        {card.is_new ? <span className="ml-2 rounded-full bg-otter-soft px-2 py-0.5 text-xs normal-case text-otter">{en.review.new}</span> : null}
      </p>
      {card.card_type === 'cloze' ? <ClozeText text={card.prompt} /> : <p className="text-xl leading-relaxed md:text-2xl">{card.prompt}</p>}

      {card.hint ? (
        showHint ? (
          <p className="rounded-xl bg-paper px-4 py-3 text-muted">{card.hint}</p>
        ) : (
          <button type="button" className="min-h-11 text-sm font-medium text-river hover:underline" onClick={() => {
              setShowHint(true)
              // The hint button disappears; keep the learner in the answer field.
              input.current?.focus()
            }}
          >
            {en.review.showHint}
          </button>
        )
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="answer" className="sr-only">
          {en.review.answerLabel}
        </label>
        <input
          ref={input}
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={120}
          placeholder={en.review.answerPlaceholder}
          className="h-12 w-full min-w-0 rounded-xl sm:flex-1 border border-line bg-surface px-4 text-lg focus:border-river focus:outline-none focus:ring-3 focus:ring-river/20"
        />
        <Button type="submit" className="h-12" loading={busy} disabled={!answer.trim()}>
          {en.review.check}
        </Button>
      </div>
      <button type="button" className="min-h-11 text-sm text-muted hover:text-ink" disabled={busy} onClick={() => onCheck('')}>
        {en.review.dontKnow}
      </button>
    </form>
  )
}
