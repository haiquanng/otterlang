import { Mic, Play, Snail, Square, Volume2 } from 'lucide-react'
import { HighlightedSentence } from '@/components/HighlightedSentence'
import { useShadowRecorder } from '@/hooks/useShadowRecorder'
import { en } from '@/i18n/en'
import type { PracticeSentence } from '@/lib/speakingApi'
import { canRecord, canSpeak, speak } from '@/lib/speech'
import { heardShare, matchWords } from '@/lib/speechMatch'

const buttonClass =
  'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-river'

/** Shadowing one sentence: listen, record yourself, play both back, see which words came through. */
export function ShadowCard({ item }: { item: PracticeSentence }) {
  const recorder = useShadowRecorder()
  const recording = recorder.status === 'recording'
  const words = recorder.transcript !== null ? matchWords(item.sentence, recorder.transcript) : null
  const message = recording
    ? en.speak.recordingHint
    : recorder.status === 'denied'
      ? en.speak.micDenied
      : recorder.status === 'error'
        ? en.speak.micError
        : words
          ? en.speak.heard(Math.round(heardShare(words) * 100))
          : recorder.status === 'done' && recorder.recognitionFailed
            ? en.speak.noCheck
            : recorder.status === 'done' && !recorder.canRecognize
              ? en.speak.noRecognition
              : null

  return (
    <article className="space-y-3 rounded-2xl border border-line bg-surface px-4 py-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {item.term} · {item.mine ? en.speak.mine : en.speak.saved}
      </p>
      {words ? (
        <p className="font-reading text-lg leading-relaxed">
          {words.map((w, i) => (
            <span key={i} className={w.heard ? 'text-river' : 'text-danger underline decoration-dotted underline-offset-4'}>
              {w.word}{' '}
            </span>
          ))}
        </p>
      ) : (
        <HighlightedSentence sentence={item.sentence} word={item.term} className="text-lg" />
      )}
      <div className="flex flex-wrap gap-2">
        {canSpeak() ? (
          <>
            <button type="button" className={buttonClass} onClick={() => speak(item.sentence)}>
              <Volume2 className="size-4" aria-hidden />
              {en.speak.listen}
            </button>
            <button type="button" className={buttonClass} onClick={() => speak(item.sentence, 0.7)}>
              <Snail className="size-4" aria-hidden />
              {en.speak.slow}
            </button>
          </>
        ) : null}
        {canRecord() ? (
          <button
            type="button"
            aria-pressed={recording}
            className={`${buttonClass} ${recording ? 'border-danger text-danger' : ''}`}
            onClick={() => (recording ? recorder.stop() : void recorder.start())}
          >
            {recording ? <Square className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
            {recording ? en.speak.stop : recorder.audioUrl ? en.speak.again : en.speak.record}
          </button>
        ) : null}
        {recorder.audioUrl && !recording ? (
          <button type="button" className={buttonClass} onClick={() => void new Audio(recorder.audioUrl ?? '').play()}>
            <Play className="size-4" aria-hidden />
            {en.speak.playMine}
          </button>
        ) : null}
      </div>
      {message ? (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      ) : null}
    </article>
  )
}
