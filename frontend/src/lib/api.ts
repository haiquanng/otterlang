import { z } from 'zod'
import { request } from '@/lib/http'
import {
  addedSchema,
  candidateSchema,
  itemDetailSchema,
  itemSchema,
  sourceSchema,
  sourceSummarySchema,
  tokenSchema,
  userSchema,
  type ItemFilters,
  type ItemInput,
  type ItemUpdate,
  type SourceInput,
  type SourceKind,
  type User,
} from '@/lib/schemas'
import { clearSession, setSession } from '@/lib/session'

export { ApiError, refreshSession } from '@/lib/http'

export async function signIn(email: string, password: string): Promise<User> {
  const data = await request('/auth/login', tokenSchema, {
    method: 'POST',
    body: { email, password },
    retryOn401: false,
  })
  setSession(data.access_token, data.user)
  return data.user
}

export async function signOut(): Promise<void> {
  try {
    await request('/auth/logout', z.undefined(), { method: 'POST', retryOn401: false })
  } finally {
    // Sign out locally even if the server is unreachable.
    clearSession()
  }
}

export function getMe() {
  return request('/me', userSchema)
}

export type MeUpdate = {
  daily_goal?: number
  display_name?: string | null
  reminder_enabled?: boolean
  reminder_hour?: number
  timezone?: string
}

export function updateMe(update: MeUpdate) {
  return request('/me', userSchema, { method: 'PATCH', body: update })
}

export function listSources() {
  return request('/sources', z.array(sourceSummarySchema))
}

export function getSource(id: string) {
  return request(`/sources/${encodeURIComponent(id)}`, sourceSchema)
}

export function createSource(input: SourceInput) {
  return request('/sources', sourceSchema, { method: 'POST', body: input })
}

export function importSource(url: string, kind: SourceKind) {
  return request('/sources/import', sourceSchema, { method: 'POST', body: { url, kind } })
}

export function deleteSource(id: string) {
  return request(`/sources/${encodeURIComponent(id)}`, z.undefined(), { method: 'DELETE' })
}

export function listCandidates(sourceId: string) {
  return request(`/sources/${encodeURIComponent(sourceId)}/candidates`, z.array(candidateSchema))
}

export function markKnown(lemma: string) {
  return request('/known-words', addedSchema, { method: 'POST', body: { lemma } })
}

export function markKnownBulk(lemmas: string[]) {
  return request('/known-words/bulk', addedSchema, { method: 'POST', body: { lemmas } })
}

export function unmarkKnown(lemma: string) {
  return request(`/known-words/${encodeURIComponent(lemma)}`, z.undefined(), { method: 'DELETE' })
}

export function listItems({ q, tag }: ItemFilters = {}) {
  const params = new URLSearchParams()
  if (q?.trim()) params.set('q', q.trim())
  if (tag) params.set('tag', tag)
  const query = params.toString()
  return request(`/items${query ? `?${query}` : ''}`, z.array(itemSchema))
}

export function getItem(id: string) {
  return request(`/items/${encodeURIComponent(id)}`, itemDetailSchema)
}

export function createItem(input: ItemInput) {
  return request('/items', itemDetailSchema, { method: 'POST', body: input })
}

export function updateItem(id: string, update: ItemUpdate) {
  return request(`/items/${encodeURIComponent(id)}`, itemDetailSchema, { method: 'PATCH', body: update })
}

export function deleteItem(id: string) {
  return request(`/items/${encodeURIComponent(id)}`, z.undefined(), { method: 'DELETE' })
}
