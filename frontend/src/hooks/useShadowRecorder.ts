import { useEffect, useRef, useState } from 'react'
import { recognitionConstructor, stopSound, transcriptOf, type Recognition } from '@/lib/speech'

type Status = 'idle' | 'recording' | 'done' | 'denied' | 'error'

/**
 * Records the learner reading a sentence and, where the browser can, transcribes it
 * at the same time. Recognition failing never loses the recording.
 */
export function useShadowRecorder() {
  const [status, setStatus] = useState<Status>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [recognitionFailed, setRecognitionFailed] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)
  const recognition = useRef<Recognition | null>(null)

  useEffect(() => () => {
    recorder.current?.stream.getTracks().forEach((track) => track.stop())
    recognition.current?.abort()
  }, [])
  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  async function start() {
    // Otherwise the microphone records the app's own playback.
    stopSound()
    setTranscript(null)
    setRecognitionFailed(false)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      setStatus(error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'error')
      return
    }
    const chunks: Blob[] = []
    const media = new MediaRecorder(stream)
    media.ondataavailable = (event) => chunks.push(event.data)
    media.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      setAudioUrl(URL.createObjectURL(new Blob(chunks, { type: media.mimeType })))
      setStatus('done')
    }
    recorder.current = media
    media.start()
    setStatus('recording')

    const Ctor = recognitionConstructor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (event) => setTranscript(transcriptOf(event))
    rec.onerror = () => setRecognitionFailed(true)
    recognition.current = rec
    try {
      rec.start()
    } catch {
      setRecognitionFailed(true)
    }
  }

  function stop() {
    recorder.current?.stop()
    recognition.current?.stop()
  }

  return { status, audioUrl, transcript, recognitionFailed, canRecognize: recognitionConstructor() !== null, start, stop }
}
