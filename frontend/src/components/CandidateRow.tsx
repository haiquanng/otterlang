import { Check, Plus, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { HighlightedSentence } from '@/components/HighlightedSentence'
import { en } from '@/i18n/en'
import type { Candidate } from '@/lib/schemas'

type Props = {
  candidate: Candidate
  onSave: () => void
  onKnown: () => void
  onSkip: () => void
}

export function CandidateRow({ candidate, onSave, onKnown, onSkip }: Props) {
  const { surface, lemma, sentence, count } = candidate

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 lg:flex lg:items-start lg:gap-6 lg:p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="text-lg font-semibold">{surface}</h2>
          {lemma !== surface ? <span className="text-sm text-muted">{lemma}</span> : null}
          {count > 1 ? (
            <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-muted">
              {en.pick.occurrences(count)}
            </span>
          ) : null}
        </div>
        <HighlightedSentence sentence={sentence} word={surface} className="mt-2 text-[15px] text-ink/85" />
      </div>
      <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2 lg:mt-0 lg:flex lg:shrink-0">
        <Button onClick={onSave} aria-label={`${en.pick.save}: ${surface}`}>
          <Plus className="size-4" aria-hidden />
          {en.pick.save}
        </Button>
        <Button variant="secondary" onClick={onKnown} aria-label={`${en.pick.known}: ${surface}`}>
          <Check className="size-4" aria-hidden />
          {en.pick.known}
        </Button>
        <Button variant="secondary" onClick={onSkip} aria-label={`${en.pick.skip} ${surface}`}>
          <X className="size-4" aria-hidden />
          <span className="sr-only lg:not-sr-only">{en.pick.skip}</span>
        </Button>
      </div>
    </article>
  )
}
