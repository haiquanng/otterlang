import { transcriptOf, type Recognition } from '@/lib/speech'

// Chrome reports these for silence or for our own stop(); they are not failures.
const HARMLESS = new Set(['no-speech', 'aborted'])
// Each restart follows a pause; a sentence never needs this many.
const MAX_SESSIONS = 30

export type Transcriber = { stop: () => void; abort: () => void }

const join = (...parts: string[]) => parts.filter(Boolean).join(' ')

/**
 * Keeps speech recognition listening until stop(). Browsers end a session after a pause
 * even in continuous mode, so a new session starts and its text is appended.
 */
export function startTranscriber(
  Ctor: new () => Recognition,
  onText: (text: string) => void,
  onFail: () => void,
): Transcriber {
  let earlier = ''
  let current = ''
  let finished = false
  let sessions = 0
  let session: Recognition | null = null

  const fail = () => {
    if (finished) return
    finished = true
    onFail()
  }

  const begin = () => {
    if (sessions >= MAX_SESSIONS) return fail()
    sessions++
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (event) => {
      current = transcriptOf(event)
      onText(join(earlier, current))
    }
    rec.onerror = (event) => {
      if (!HARMLESS.has(event.error)) fail()
    }
    rec.onend = () => {
      earlier = join(earlier, current)
      current = ''
      if (!finished) begin()
    }
    session = rec
    try {
      rec.start()
    } catch {
      fail()
    }
  }

  begin()
  return {
    stop: () => {
      finished = true
      session?.stop()
    },
    abort: () => {
      finished = true
      session?.abort()
    },
  }
}
