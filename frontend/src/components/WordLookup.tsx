import { ExternalLink, Volume2 } from 'lucide-react'
import { en } from '@/i18n/en'
import { canSpeak, speak } from '@/lib/speech'
import { cambridgeUrl, translateUrl } from '@/lib/tags'

const linkClass =
  'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-river'

/** Pronunciation via the browser and links out to real dictionaries: no generated translations. */
export function WordLookup({ term }: { term: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {canSpeak() ? (
        <button type="button" className={linkClass} onClick={() => speak(term)}>
          <Volume2 className="size-4" aria-hidden />
          {en.item.listen}
        </button>
      ) : null}
      <a className={linkClass} href={cambridgeUrl(term)} target="_blank" rel="noopener noreferrer">
        {en.item.cambridge}
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
      <a className={linkClass} href={translateUrl(term)} target="_blank" rel="noopener noreferrer">
        {en.item.translate}
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </div>
  )
}
