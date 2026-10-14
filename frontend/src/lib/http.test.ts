import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiError, request } from '@/lib/http'
import { clearSession, getSession, setSession } from '@/lib/session'

const user = {
  id: '6f1c2a52-3b5e-4c1f-9f57-0d2b8b0c6a11',
  email: 'otter@example.com',
  display_name: null,
  skip_top_n: 3000,
}
const tokenBody = { access_token: 'fresh', token_type: 'bearer', user }
const okSchema = z.object({ ok: z.boolean() })

function authHeader(call: unknown[]): string | undefined {
  const init = call[1] as RequestInit
  return (init.headers as Record<string, string>).Authorization
}

describe('request', () => {
  beforeEach(() => setSession('stale', user))
  afterEach(() => {
    vi.unstubAllGlobals()
    clearSession()
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    const fetchMock = vi.fn((url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(Response.json(tokenBody))
      const token = (init.headers as Record<string, string>).Authorization
      return Promise.resolve(
        token === 'Bearer fresh' ? Response.json({ ok: true }) : new Response(null, { status: 401 }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(request('/me', okSchema)).resolves.toEqual({ ok: true })
    expect(fetchMock.mock.calls.map((c) => c[0]).filter((u) => u.endsWith('/auth/refresh'))).toHaveLength(1)
    expect(authHeader(fetchMock.mock.calls.at(-1) ?? [])).toBe('Bearer fresh')
  })

  it('shares one refresh between concurrent 401s', async () => {
    let refreshCalls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init: RequestInit) => {
        if (url.endsWith('/auth/refresh')) {
          refreshCalls += 1
          return Promise.resolve(Response.json(tokenBody))
        }
        const token = (init.headers as Record<string, string>).Authorization
        return Promise.resolve(
          token === 'Bearer fresh' ? Response.json({ ok: true }) : new Response(null, { status: 401 }),
        )
      }),
    )

    await Promise.all([request('/a', okSchema), request('/b', okSchema), request('/c', okSchema)])
    expect(refreshCalls).toBe(1)
  })

  it('signs out and throws when the refresh is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(null, { status: 401 }))))

    await expect(request('/me', okSchema)).rejects.toBeInstanceOf(ApiError)
    expect(getSession().status).toBe('signed-out')
  })

  it('does not refresh when retryOn401 is false', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ detail: 'Wrong email or password' }, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(request('/auth/login', okSchema, { retryOn401: false })).rejects.toThrow('Wrong email or password')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(getSession().status).toBe('signed-in')
  })
})
