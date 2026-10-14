import type { Page } from '@playwright/test'

const API = 'http://localhost:8000'

type Source = { id: string; title: string; kind: string; url: string | null; body: string; created_at: string }

/** In-memory documents API, enough for list / create / read / delete flows. */
export async function mockSources(page: Page) {
  const sources: Source[] = []

  await page.route(`${API}/sources`, async (route) => {
    if (route.request().method() === 'POST') {
      const input = route.request().postDataJSON() as Omit<Source, 'id' | 'created_at'>
      const source: Source = {
        ...input,
        url: input.url || null,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }
      sources.unshift(source)
      return route.fulfill({ status: 201, json: source })
    }
    return route.fulfill({
      json: sources.map(({ body, ...rest }) => ({ ...rest, char_count: body.length })),
    })
  })

  await page.route(`${API}/sources/*`, async (route) => {
    const id = route.request().url().split('/').pop()
    const index = sources.findIndex((s) => s.id === id)
    if (index === -1) return route.fulfill({ status: 404, json: { detail: 'Document not found' } })
    if (route.request().method() === 'DELETE') {
      sources.splice(index, 1)
      return route.fulfill({ status: 204 })
    }
    return route.fulfill({ json: sources[index] })
  })
  return sources
}
