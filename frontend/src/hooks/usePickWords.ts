import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { en } from '@/i18n/en'
import { listCandidates, markKnown, markKnownBulk, unmarkKnown } from '@/lib/api'
import type { Candidate } from '@/lib/schemas'

export type Toast = { id: number; message: string; undo: () => void }

/**
 * Candidate list with optimistic Known / Skip and a single-level undo.
 * Skips are local only: the word comes back next time, as the PRD describes.
 */
export function usePickWords(sourceId: string) {
  const query = useQuery({
    queryKey: ['candidates', sourceId],
    queryFn: () => listCandidates(sourceId),
    staleTime: 0,
  })
  const [handled, setHandled] = useState<ReadonlySet<string>>(new Set())
  const [toast, setToast] = useState<Toast | null>(null)
  const [error, setError] = useState(false)
  // Stable identity: the toast's auto-dismiss timer depends on it.
  const dismissToast = useCallback(() => setToast(null), [])

  const all = query.data ?? []
  const remaining = all.filter((c) => !handled.has(c.lemma))

  function hide(lemmas: string[]) {
    setHandled((prev) => new Set([...prev, ...lemmas]))
  }

  function unhide(lemmas: string[]) {
    setHandled((prev) => new Set([...prev].filter((l) => !lemmas.includes(l))))
  }

  function show(message: string, undo: () => void) {
    setToast({ id: Date.now(), message, undo })
  }

  function known(candidate: Candidate) {
    const lemmas = [candidate.lemma]
    hide(lemmas)
    setError(false)
    markKnown(candidate.lemma)
      .then(() =>
        show(en.pick.markedKnown(candidate.surface), () => {
          unhide(lemmas)
          void unmarkKnown(candidate.lemma)
        }),
      )
      .catch(() => {
        unhide(lemmas)
        setError(true)
      })
  }

  function skip(candidate: Candidate) {
    hide([candidate.lemma])
    show(en.pick.skipped(candidate.surface), () => unhide([candidate.lemma]))
  }

  function knowTheRest() {
    const lemmas = remaining.map((c) => c.lemma)
    if (lemmas.length === 0) return
    hide(lemmas)
    setError(false)
    markKnownBulk(lemmas)
      .then(() =>
        show(en.pick.restKnown(lemmas.length), () => {
          unhide(lemmas)
          void Promise.all(lemmas.map(unmarkKnown))
        }),
      )
      .catch(() => {
        unhide(lemmas)
        setError(true)
      })
  }

  return {
    query,
    total: all.length,
    remaining,
    toast,
    dismissToast,
    error,
    known,
    skip,
    knowTheRest,
  }
}
