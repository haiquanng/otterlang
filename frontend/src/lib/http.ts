import type { z } from 'zod'
import { tokenSchema } from '@/lib/schemas'
import { clearSession, getSession, setSession } from '@/lib/session'

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  // false for endpoints where a 401 means "wrong input", not "token expired".
  retryOn401?: boolean
}

function send(path: string, { method = 'GET', body }: RequestOptions, token: string | null) {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
  })
}

async function readDetail(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
      return data.detail
    }
  } catch {
    // Non-JSON error body; fall through to the generic message.
  }
  return `Request failed (${response.status})`
}

let refreshing: Promise<boolean> | null = null

/**
 * Exchange the refresh cookie for a new access token. Concurrent callers share one request,
 * because the server rotates the cookie and a second parallel refresh would look like reuse.
 * Resolves false when the session is over; rejects on network errors (server asleep or offline)
 * so callers can retry instead of signing the user out.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const response = await send('/auth/refresh', { method: 'POST' }, null)
      if (!response.ok) {
        clearSession()
        return false
      }
      const data = tokenSchema.parse(await response.json())
      setSession(data.access_token, data.user)
      return true
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  let response = await send(path, options, getSession().accessToken)
  if (response.status === 401 && options.retryOn401 !== false && (await refreshSession())) {
    response = await send(path, options, getSession().accessToken)
  }
  if (!response.ok) throw new ApiError(response.status, await readDetail(response))
  return schema.parse(response.status === 204 ? undefined : await response.json())
}
