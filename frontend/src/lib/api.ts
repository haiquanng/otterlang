import { z } from 'zod'
import { request } from '@/lib/http'
import {
  healthSchema,
  sourceSchema,
  sourceSummarySchema,
  tokenSchema,
  userSchema,
  type SourceInput,
  type User,
} from '@/lib/schemas'
import { clearSession, setSession } from '@/lib/session'

export { ApiError, refreshSession } from '@/lib/http'

export function getHealth() {
  return request('/health', healthSchema, { retryOn401: false })
}

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

export function listSources() {
  return request('/sources', z.array(sourceSummarySchema))
}

export function getSource(id: string) {
  return request(`/sources/${encodeURIComponent(id)}`, sourceSchema)
}

export function createSource(input: SourceInput) {
  return request('/sources', sourceSchema, { method: 'POST', body: input })
}

export function deleteSource(id: string) {
  return request(`/sources/${encodeURIComponent(id)}`, z.undefined(), { method: 'DELETE' })
}
