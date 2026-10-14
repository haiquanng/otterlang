import { describe, expect, it } from 'vitest'
import { pushSupport, urlBase64ToUint8Array } from '@/lib/push'

describe('urlBase64ToUint8Array', () => {
  it('decodes base64url without padding', () => {
    // "hi?" -> base64 "aGk/" -> base64url "aGk_"
    expect(Array.from(urlBase64ToUint8Array('aGk_'))).toEqual([104, 105, 63])
    expect(Array.from(urlBase64ToUint8Array('aGk'))).toEqual([104, 105])
  })
})

describe('pushSupport', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'
  const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0)'

  it('asks iPhone users to add the app to the Home Screen first', () => {
    expect(pushSupport(iphone, false, true)).toBe('install-first')
    expect(pushSupport(iphone, true, true)).toBe('supported')
  })

  it('depends on the browser APIs elsewhere', () => {
    expect(pushSupport(mac, false, true)).toBe('supported')
    expect(pushSupport(mac, false, false)).toBe('unsupported')
  })
})
