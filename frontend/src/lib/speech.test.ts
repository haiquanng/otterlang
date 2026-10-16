import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playRecording, speak, stopSound } from '@/lib/speech'

class FakeAudio {
  static made: FakeAudio[] = []
  paused = true
  onended: (() => void) | null = null
  constructor() {
    FakeAudio.made.push(this)
  }
  play() {
    this.paused = false
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
}

const synth = { speak: vi.fn(), cancel: vi.fn() }

beforeEach(() => {
  FakeAudio.made = []
  synth.speak.mockClear()
  synth.cancel.mockClear()
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('SpeechSynthesisUtterance', class { lang = ''; rate = 1 })
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
})

afterEach(() => {
  stopSound()
  vi.unstubAllGlobals()
})

describe('one sound at a time', () => {
  it('playing a recording stops the voice reading the sentence', () => {
    speak('We ship small changes.')
    synth.cancel.mockClear()
    playRecording('blob:mine')
    expect(synth.cancel).toHaveBeenCalled()
    expect(FakeAudio.made[0]?.paused).toBe(false)
  })

  it('listening stops a recording that is playing', () => {
    playRecording('blob:mine')
    speak('We ship small changes.')
    expect(FakeAudio.made[0]?.paused).toBe(true)
    expect(synth.speak).toHaveBeenCalledTimes(1)
  })

  it('a second recording, even from another card, stops the first', () => {
    playRecording('blob:first')
    playRecording('blob:second')
    expect(FakeAudio.made.map((a) => a.paused)).toEqual([true, false])
  })

  it('stopSound silences everything', () => {
    playRecording('blob:mine')
    stopSound()
    expect(FakeAudio.made[0]?.paused).toBe(true)
    expect(synth.cancel).toHaveBeenCalled()
  })
})
