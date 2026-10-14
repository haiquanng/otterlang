import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, getHealth } from '@/lib/api'

describe('getHealth', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns the parsed body when the server is up', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'ok' })))
    await expect(getHealth()).resolves.toEqual({ status: 'ok' })
  })

  it('throws ApiError on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })))
    await expect(getHealth()).rejects.toBeInstanceOf(ApiError)
  })

  it('rejects a body that does not match the schema', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'nope' })))
    await expect(getHealth()).rejects.toThrow()
  })
})
