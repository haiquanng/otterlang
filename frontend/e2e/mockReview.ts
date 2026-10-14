import type { Page } from '@playwright/test'

const API = 'http://localhost:8000'

const cards = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    item_id: '21111111-1111-4111-8111-111111111111',
    card_type: 'cloze',
    prompt: '_____ a cache is notoriously difficult.',
    hint: 'Make something no longer valid.',
    is_new: true,
  },
  {
    id: '12222222-2222-4222-8222-222222222222',
    item_id: '22222222-2222-4222-8222-222222222222',
    card_type: 'define_to_word',
    prompt: 'Giving the same result when repeated.',
    hint: 'i…',
    is_new: false,
  },
]

const answers: Record<string, { expected: string; accepted: string[]; sentence: string | null; definition: string }> = {
  [cards[0]!.id]: {
    expected: 'Invalidating',
    accepted: ['invalidating', 'invalidate'],
    sentence: 'Invalidating a cache is notoriously difficult.',
    definition: 'Make something no longer valid.',
  },
  [cards[1]!.id]: {
    expected: 'idempotent',
    accepted: ['idempotent'],
    sentence: null,
    definition: 'Giving the same result when repeated.',
  },
}

/** Two due cards; records every rating sent. */
export async function mockReview(page: Page, { empty = false } = {}) {
  const ratings: { id: string; rating: number; correct: boolean }[] = []

  await page.route(`${API}/review/due**`, (route) => route.fulfill({ json: empty ? [] : cards }))
  await page.route(`${API}/review/*/check`, (route) => {
    const id = route.request().url().split('/').at(-2) ?? ''
    const { answer } = route.request().postDataJSON() as { answer: string }
    const card = answers[id]!
    const correct = card.accepted.includes(answer.trim().toLowerCase())
    return route.fulfill({
      json: { correct, close: false, expected: card.expected, sentence: card.sentence, definition: card.definition, suggested_rating: correct ? 3 : 1 },
    })
  })
  await page.route(`${API}/review/*/answer`, (route) => {
    const id = route.request().url().split('/').at(-2) ?? ''
    const body = route.request().postDataJSON() as { rating: number; correct: boolean }
    ratings.push({ id, ...body })
    return route.fulfill({ json: { due: new Date(Date.now() + 86_400_000).toISOString(), state: 'review' } })
  })
  return ratings
}
