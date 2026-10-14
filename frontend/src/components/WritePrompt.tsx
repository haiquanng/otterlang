import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/Button'
import { en } from '@/i18n/en'
import type { ReviewCard } from '@/lib/reviewApi'

type Props = {
  card: ReviewCard
  busy: boolean
  onShown: () => void
  onCheck: (answer: string) => void
}

/** Writing card: produce a sentence with the word, the step closest to real communication. */
export function WritePrompt({ card, busy, onShown, onCheck }: Props) {
  const [sentence, setSentence] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    onShown()
    field.current?.focus()
  }, [card.id, onShown])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (sentence.trim()) onCheck(sentence)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter makes a new line in a textarea; Cmd/Ctrl+Enter submits.
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && sentence.trim()) {
      event.preventDefault()
      onCheck(sentence)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-sm font-medium uppercase tracking-wide text-muted">{en.review.writeSentence}</p>
      <div>
        <p className="text-3xl font-semibold tracking-tight">{card.prompt}</p>
        {card.hint ? <p className="mt-2 text-muted">{card.hint}</p> : null}
      </div>
      <div>
        <label htmlFor="sentence" className="mb-1.5 block text-sm font-medium">
          {en.review.writeLabel(card.prompt)}
        </label>
        <textarea
          ref={field}
          id="sentence"
          rows={3}
          maxLength={500}
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={en.review.writePlaceholder}
          className="block w-full rounded-xl border border-line bg-surface px-4 py-3 text-lg focus:border-river focus:outline-none focus:ring-3 focus:ring-river/20"
        />
        <p className="mt-1.5 text-xs text-muted">{en.review.writeShortcut}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={busy} disabled={!sentence.trim()}>
          {en.review.check}
        </Button>
        <button type="button" className="min-h-11 text-sm text-muted hover:text-ink" disabled={busy} onClick={() => onCheck('')}>
          {en.review.skipWriting}
        </button>
      </div>
    </form>
  )
}
