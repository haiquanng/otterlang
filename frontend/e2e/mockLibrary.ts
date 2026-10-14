import type { Page } from '@playwright/test'

const API = 'http://localhost:8000'

const docs = [
  { id: 'a1111111-1111-4111-8111-111111111111', title: 'Idempotence', kind: 'tech_blog', body: 'An idempotent operation can be applied many times without changing the result.' },
  { id: 'a2222222-2222-4222-8222-222222222222', title: 'Coral reef', kind: 'ielts', body: 'Coral reefs are underwater ecosystems built by colonies of tiny animals.' },
  { id: 'a3333333-3333-4333-8333-333333333333', title: 'Rate limiting', kind: 'tech_blog', body: 'Rate limiting controls how often a client may call a service.' },
]

/**
 * Starter library on top of mockSources: adding a text creates a document in the shared
 * `sources` array so the app can open it. Returns the ids that were added.
 */
export async function mockLibrary(page: Page, sources: { id: string; title: string; kind: string; url: string | null; body: string; created_at: string }[]) {
  const added = new Map<string, string>()

  await page.route(`${API}/library-documents**`, async (route) => {
    const url = new URL(route.request().url())
    const addMatch = url.pathname.match(/^\/library-documents\/([^/]+)\/add$/)
    if (addMatch && route.request().method() === 'POST') {
      const doc = docs.find((d) => d.id === addMatch[1])
      if (!doc) return route.fulfill({ status: 404, json: { detail: 'Library text not found' } })
      const existing = added.get(doc.id)
      if (existing) return route.fulfill({ json: { source_id: existing } })
      const sourceId = crypto.randomUUID()
      sources.unshift({ id: sourceId, title: doc.title, kind: doc.kind, url: null, body: doc.body, created_at: new Date().toISOString() })
      added.set(doc.id, sourceId)
      return route.fulfill({ status: 201, json: { source_id: sourceId } })
    }
    const kind = url.searchParams.get('kind')
    return route.fulfill({
      json: docs
        .filter((d) => !kind || d.kind === kind)
        .map(({ body, ...d }) => ({ ...d, source_name: 'Wikipedia', license: 'CC BY-SA 4.0', word_count: body.split(' ').length, source_id: added.get(d.id) ?? null })),
    })
  })
  return added
}
