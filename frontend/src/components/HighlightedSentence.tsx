import { highlight } from '@/lib/highlight'

type Props = {
  sentence: string
  word: string
  className?: string
}

export function HighlightedSentence({ sentence, word, className = '' }: Props) {
  return (
    <p className={`font-reading leading-relaxed ${className}`}>
      {highlight(sentence, word).map((segment, i) =>
        segment.match ? (
          <mark key={i} className="rounded bg-otter-soft px-0.5 text-ink">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </p>
  )
}
