import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import { answerCard, checkCard, getDueCards, type CheckResult, type Rating } from '@/lib/reviewApi'

type Phase = 'answering' | 'checking' | 'result' | 'saving'

/**
 * One review session: a fixed batch of due cards, each answered then rated.
 * The batch is loaded once so cards do not reshuffle while the learner works.
 */
export function useReviewSession() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['review', 'due'], queryFn: () => getDueCards(), staleTime: Number.POSITIVE_INFINITY })
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('answering')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [error, setError] = useState(false)
  const shownAt = useRef(0)
  const responseMs = useRef(0)

  const cards = query.data ?? []
  const card = cards[index]
  const finished = query.isSuccess && index >= cards.length

  // Stable identity so the prompt can restart the timer only when a new card appears.
  const startTimer = useCallback(() => {
    shownAt.current = performance.now()
  }, [])

  async function check(answer: string) {
    if (!card || phase !== 'answering') return
    responseMs.current = Math.round(performance.now() - shownAt.current)
    setPhase('checking')
    setError(false)
    try {
      setResult(await checkCard(card.id, answer, responseMs.current))
      setPhase('result')
    } catch {
      setError(true)
      setPhase('answering')
    }
  }

  async function rate(rating: Rating) {
    if (!card || !result || phase !== 'result') return
    setPhase('saving')
    setError(false)
    try {
      await answerCard(card.id, rating, result.correct, responseMs.current)
      if (result.correct) setCorrectCount((n) => n + 1)
      setResult(null)
      setIndex((i) => i + 1)
      setPhase('answering')
    } catch {
      setError(true)
      setPhase('result')
    }
  }

  async function restart() {
    setIndex(0)
    setCorrectCount(0)
    setResult(null)
    setPhase('answering')
    await queryClient.resetQueries({ queryKey: ['review', 'due'] })
    void queryClient.invalidateQueries({ queryKey: ['today'] })
  }

  return { query, cards, card, index, phase, result, correctCount, finished, error, startTimer, check, rate, restart }
}
