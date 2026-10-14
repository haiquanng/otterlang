import * as Popover from '@radix-ui/react-popover'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState, type MouseEvent } from 'react'
import { WordPopoverBody } from '@/components/WordPopoverBody'
import { normalizeSurface, paragraphs, sentenceAt, tokenize } from '@/lib/reading'
import { getAnnotations } from '@/lib/readingApi'
import type { Tag } from '@/lib/schemas'

type Props = {
  sourceId: string
  body: string
  tag: Tag
}

type Active = { word: string; offset: number }

/** The document text with every word tappable and saved words highlighted. */
export function ReadingText({ sourceId, body, tag }: Props) {
  const annotations = useQuery({ queryKey: ['annotations', sourceId], queryFn: () => getAnnotations(sourceId) })
  const saved = annotations.data?.saved ?? {}
  const [active, setActive] = useState<Active | null>(null)
  // Radix anchors the popover to whichever word was tapped, without a trigger per word.
  const anchor = useRef<HTMLElement | null>(null)
  const virtualRef = useRef({ getBoundingClientRect: () => anchor.current?.getBoundingClientRect() ?? new DOMRect() })
  const blocks = useMemo(() => paragraphs(body).map((p) => ({ ...p, tokens: tokenize(p.text) })), [body])

  function open(event: MouseEvent<HTMLSpanElement>, word: string, offset: number) {
    anchor.current = event.currentTarget
    setActive({ word, offset })
  }

  return (
    <Popover.Root open={active !== null} onOpenChange={(next) => !next && setActive(null)}>
      <Popover.Anchor virtualRef={virtualRef} />
      <div className="max-w-[68ch] space-y-5 font-reading text-[17px] leading-[1.75] md:text-lg">
        {blocks.map((block) => (
          <p key={block.start}>
            {block.tokens.map((token) => {
              if (!token.word) return <span key={token.start}>{token.text}</span>
              const offset = block.start + token.start
              const isActive = active?.offset === offset
              const isSaved = normalizeSurface(token.text) in saved
              return (
                <span
                  key={token.start}
                  onClick={(event) => open(event, token.text, offset)}
                  className={[
                    'cursor-pointer rounded-sm transition-colors',
                    isActive ? 'bg-river-soft text-river' : isSaved ? 'bg-otter-soft' : 'hover:bg-paper',
                  ].join(' ')}
                >
                  {token.text}
                </span>
              )
            })}
          </p>
        ))}
      </div>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          sideOffset={6}
          collisionPadding={12}
          className="z-30 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-line bg-surface p-4 font-sans shadow-xl focus:outline-none"
        >
          {active ? (
            <WordPopoverBody
              key={active.offset}
              word={active.word}
              sentence={sentenceAt(body, active.offset)}
              sourceId={sourceId}
              tag={tag}
            />
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
