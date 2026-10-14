import type { User } from '@/lib/schemas'

// The access token lives only in memory: nothing readable by injected scripts
// survives a reload. The refresh cookie (httpOnly) restores the session on load.
export type Session =
  | { status: 'unknown'; accessToken: null; user: null }
  | { status: 'signed-out'; accessToken: null; user: null }
  | { status: 'signed-in'; accessToken: string; user: User }

let state: Session = { status: 'unknown', accessToken: null, user: null }
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function getSession(): Session {
  return state
}

export function setSession(accessToken: string, user: User) {
  state = { status: 'signed-in', accessToken, user }
  emit()
}

export function clearSession() {
  state = { status: 'signed-out', accessToken: null, user: null }
  emit()
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
