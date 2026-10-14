import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus, Undo2 } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/Button'
import { WordLookup } from '@/components/WordLookup'
import { en } from '@/i18n/en'
import { createItem, markKnown, unmarkKnown } from '@/lib/api'
import { normalizeSurface } from '@/lib/reading'
import { lookupWord } from '@/lib/readingApi'
import type { Tag } from '@/lib/schemas'

type Props = {
  word: string
  sentence: string
  sourceId: string
  tag: Tag
}

/** Meaning and actions for one tapped word in the reading view. */
export function WordPopoverBody({ word, sentence, sourceId, tag }: Props) {
  const queryClient = useQueryClient()
  const key = ['lookup', normalizeSurface(word)]
  const lookup = useQuery({ queryKey: key, queryFn: () => lookupWord(word), staleTime: 60_000 })

  const refresh = () =>
    Promise.all(
      [key, ['annotations', sourceId], ['items'], ['today'], ['candidates', sourceId]].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
  const learn = useMutation({
    mutationFn: (lemma: string) =>
      createItem({ term: lemma, surface: word, sentence, source_id: sourceId, tags: [tag] }),
    onSuccess: refresh,
  })
  const know = useMutation({ mutationFn: markKnown, onSuccess: refresh })
  const unknow = useMutation({ mutationFn: unmarkKnown, onSuccess: refresh })

  if (lookup.isPending) {
    return (
      <div className="space-y-2" aria-busy>
        <div className="h-6 w-1/2 animate-pulse rounded bg-paper" />
        <div className="h-12 animate-pulse rounded bg-paper" />
      </div>
    )
  }
  if (lookup.isError) return <p className="text-sm text-danger">{en.common.loadError}</p>

  const data = lookup.data
  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-semibold">
          {data.lemma}
          {data.lemma !== data.word ? <span className="ml-2 text-sm font-normal text-muted">{data.word}</span> : null}
        </p>
        <p className="text-sm text-muted">{[data.pos, data.phonetic].filter(Boolean).join(' · ')}</p>
      </div>
      <p className={`text-sm leading-relaxed ${data.definition ? 'text-ink' : 'italic text-muted'}`}>
        {data.definition ?? en.reading.noDefinition}
      </p>

      {data.status === 'new' ? (
        <div className="grid grid-cols-2 gap-2">
          <Button loading={learn.isPending} onClick={() => learn.mutate(data.lemma)}>
            <Plus className="size-4" aria-hidden />
            {en.pick.save}
          </Button>
          <Button variant="secondary" loading={know.isPending} onClick={() => know.mutate(data.lemma)}>
            <Check className="size-4" aria-hidden />
            {en.pick.known}
          </Button>
        </div>
      ) : data.status === 'saved' && data.item_id ? (
        <div className="flex items-center justify-between rounded-xl bg-otter-soft px-3 py-2 text-sm text-otter">
          <span className="font-medium">{en.reading.inLibrary}</span>
          <Link to={`/library/${data.item_id}`} className="font-semibold hover:underline">
            {en.starter.open}
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-sm text-muted">
          <span>{en.reading.known}</span>
          <button type="button" className="inline-flex min-h-9 items-center gap-1 font-semibold text-river" onClick={() => unknow.mutate(data.lemma)}>
            <Undo2 className="size-4" aria-hidden />
            {en.pick.undo}
          </button>
        </div>
      )}
      {learn.isError || know.isError ? <p className="text-sm text-danger">{en.pick.actionError}</p> : null}

      <WordLookup term={data.lemma} />
    </div>
  )
}
