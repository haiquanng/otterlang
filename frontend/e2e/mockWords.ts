import type { Page } from '@playwright/test'

const API = 'http://localhost:8000'

export const candidates = [
  { lemma: 'idempotent', surface: 'idempotent', sentence: 'The idempotent endpoint is safe to retry.', rank: null, count: 1 },
  { lemma: 'invalidate', surface: 'Invalidating', sentence: 'Invalidating a cache is hard.', rank: 21000, count: 3 },
  { lemma: 'notoriously', surface: 'notoriously', sentence: 'It is notoriously difficult.', rank: 15000, count: 1 },
]

/** Candidates for any document plus a known-words store; returns the store for assertions. */
export async function mockWords(page: Page) {
  const known = new Set<string>()

  await page.route(`${API}/sources/*/candidates`, (route) =>
    route.fulfill({ json: candidates.filter((c) => !known.has(c.lemma)) }),
  )
  await page.route(`${API}/known-words`, (route) => {
    const { lemma } = route.request().postDataJSON() as { lemma: string }
    known.add(lemma)
    return route.fulfill({ status: 201, json: { added: 1 } })
  })
  await page.route(`${API}/known-words/bulk`, (route) => {
    const { lemmas } = route.request().postDataJSON() as { lemmas: string[] }
    for (const lemma of lemmas) known.add(lemma)
    return route.fulfill({ status: 201, json: { added: lemmas.length } })
  })
  await page.route(`${API}/known-words/*`, (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()
    known.delete(decodeURIComponent(route.request().url().split('/').pop() ?? ''))
    return route.fulfill({ status: 204 })
  })
  return known
}
