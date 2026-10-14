import { Check, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { HighlightedSentence } from '@/components/HighlightedSentence'
import { en } from '@/i18n/en'
import type { Candidate } from '@/lib/schemas'

type Props = {
  candidate: Candidate
  onKnown: () => void
  onSkip: () => void
}

export function CandidateRow({ candidate, onKnown, onSkip }: Props) {
  const { surface, lemma, sentence, count } = candidate

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 md:flex md:items-start md:gap-6 md:p-5">
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
      <div className="mt-4 flex gap-2 md:mt-0 md:shrink-0">
        <Button variant="secondary" className="flex-1 md:flex-none" onClick={onKnown}>
          <Check className="size-4" aria-hidden />
          {en.pick.known}
        </Button>
        <Button variant="secondary" className="flex-1 md:flex-none" onClick={onSkip} aria-label={`${en.pick.skip} ${surface}`}>
          <X className="size-4" aria-hidden />
          {en.pick.skip}
        </Button>
      </div>
    </article>
  )
}
