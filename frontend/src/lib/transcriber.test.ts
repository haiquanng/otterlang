import { describe, expect, it } from 'vitest'
import type { Recognition, RecognitionEvent } from '@/lib/speech'
import { startTranscriber } from '@/lib/transcriber'

/** Stands in for the browser's SpeechRecognition; each instance is one session. */
class FakeRecognition implements Recognition {
  static sessions: FakeRecognition[] = []
  lang = ''
  continuous = false
  interimResults = true
  onresult: ((event: RecognitionEvent) => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  started = false
  constructor() {
    FakeRecognition.sessions.push(this)
  }
  start() {
    this.started = true
  }
  stop() {
    this.onend?.()
  }
  abort() {
    this.onend?.()
  }
  hear(...phrases: string[]) {
    this.onresult?.({ results: phrases.map((transcript) => [{ transcript }]) })
  }
}

function setup() {
  FakeRecognition.sessions = []
  const seen: string[] = []
  const failures: number[] = []
  const transcriber = startTranscriber(
    FakeRecognition,
    (text) => seen.push(text),
    () => failures.push(1),
  )
  const session = (i: number) => {
    const s = FakeRecognition.sessions[i]
    if (!s) throw new Error(`no session ${i}`)
    return s
  }
  return { transcriber, seen, failures, session }
}

describe('startTranscriber', () => {
  it('listens in English, continuously, final results only', () => {
    const { session } = setup()
    expect([session(0).lang, session(0).continuous, session(0).interimResults, session(0).started]).toEqual([
      'en-US',
      true,
      false,
      true,
    ])
  })

  it('restarts when the browser ends the session on a pause, and joins the text', () => {
    const { seen, session } = setup()
    session(0).hear('we ship', 'small changes')
    session(0).onend?.()
    expect(FakeRecognition.sessions).toHaveLength(2)
    session(1).hear('every day')
    expect(seen.at(-1)).toBe('we ship small changes every day')
  })

  it('does not restart after stop', () => {
    const { transcriber, session } = setup()
    transcriber.stop()
    expect(FakeRecognition.sessions).toHaveLength(1)
    expect(session(0).started).toBe(true)
  })

  it('treats no-speech and aborted as harmless', () => {
    const { failures, session } = setup()
    session(0).onerror?.({ error: 'no-speech' })
    session(0).onerror?.({ error: 'aborted' })
    expect(failures).toEqual([])
  })

  it('reports a real error once and stops restarting', () => {
    const { failures, session } = setup()
    session(0).onerror?.({ error: 'not-allowed' })
    session(0).onend?.()
    expect(failures).toEqual([1])
    expect(FakeRecognition.sessions).toHaveLength(1)
  })

  it('gives up after too many restarts instead of looping', () => {
    const { failures } = setup()
    for (let i = 0; i < 100; i++) FakeRecognition.sessions.at(-1)?.onend?.()
    expect(FakeRecognition.sessions.length).toBeLessThan(40)
    expect(failures).toEqual([1])
  })
})
