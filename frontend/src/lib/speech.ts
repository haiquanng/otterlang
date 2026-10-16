/** Browser speech: synthesis to listen, recording and optional recognition to speak back. */

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// One sound at a time across the page: the sentence read aloud or a recording of the learner.
let playing: HTMLAudioElement | null = null

export function stopSound(): void {
  if (canSpeak()) window.speechSynthesis.cancel()
  playing?.pause()
  playing = null
}

export function speak(text: string, rate = 1): void {
  stopSound()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)
}

export function playRecording(url: string): void {
  stopSound()
  const audio = new Audio(url)
  audio.onended = () => {
    if (playing === audio) playing = null
  }
  playing = audio
  // A rejected play() (e.g. autoplay rules) just means silence; nothing to recover.
  audio.play().catch(() => undefined)
}

export function canRecord(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
}

type RecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> }

/** The part of the Web Speech API we use; TypeScript's DOM types do not include it. */
export type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

/** Chrome and Safari ship it prefixed; Firefox does not have it. */
export function recognitionConstructor(): (new () => Recognition) | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as Record<string, unknown>
  const ctor = scope.SpeechRecognition ?? scope.webkitSpeechRecognition
  return typeof ctor === 'function' ? (ctor as new () => Recognition) : null
}

export function transcriptOf(event: RecognitionEvent): string {
  return Array.from(event.results, (result) => result[0]?.transcript ?? '').join(' ')
}
