import type { Page } from '@playwright/test'

const API = 'http://localhost:8000'

type Item = {
  id: string
  type: 'word' | 'collocation'
  term: string
  lemma: string
  definition: string | null
  note: string | null
  status: 'active' | 'archived'
  tags: string[]
  created_at: string
  phonetic: string | null
  contexts: { sentence: string; surface: string | null; source_id: string | null; source_title: string | null }[]
}

type Input = { term: string; surface?: string; sentence?: string; source_id?: string; tags?: string[] }

/** In-memory items API: create, list with q/tag, get, patch, delete. */
export async function mockItems(page: Page) {
  const items: Item[] = []

  await page.route(`${API}/items**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const id = url.pathname.split('/')[2]

    if (!id && request.method() === 'POST') {
      const input = request.postDataJSON() as Input
      const term = input.term.trim()
      const item: Item = {
        id: crypto.randomUUID(),
        type: term.includes(' ') ? 'collocation' : 'word',
        term,
        lemma: term.toLowerCase(),
        definition: term === 'idempotent' ? 'Giving the same result when repeated.' : null,
        note: null,
        status: 'active',
        tags: input.tags ?? [],
        created_at: new Date().toISOString(),
        phonetic: null,
        contexts: input.sentence
          ? [{ sentence: input.sentence, surface: input.surface ?? null, source_id: input.source_id ?? null, source_title: 'Caching' }]
          : [],
      }
      items.unshift(item)
      return route.fulfill({ status: 201, json: item })
    }
    if (!id) {
      const q = url.searchParams.get('q')?.toLowerCase()
      const tag = url.searchParams.get('tag')
      const result = items.filter(
        (i) => i.status === 'active' && (!q || i.term.toLowerCase().includes(q)) && (!tag || i.tags.includes(tag)),
      )
      return route.fulfill({ json: result })
    }

    const index = items.findIndex((i) => i.id === id)
    const item = items[index]
    if (!item) return route.fulfill({ status: 404, json: { detail: 'Item not found' } })
    if (request.method() === 'DELETE') {
      items.splice(index, 1)
      return route.fulfill({ status: 204 })
    }
    if (request.method() === 'PATCH') {
      Object.assign(item, request.postDataJSON())
    }
    return route.fulfill({ json: item })
  })
  return items
}
