import { BookOpenText } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ImportLinkForm } from '@/components/ImportLinkForm'
import { PageHeader } from '@/components/PageHeader'
import { PasteForm } from '@/components/PasteForm'
import { en } from '@/i18n/en'

type Mode = 'link' | 'paste'

export function AddPage() {
  // A link is the quickest way in; pasting stays for text that is not on the web.
  const [mode, setMode] = useState<Mode>('link')
  const modes: { value: Mode; label: string }[] = [
    { value: 'link', label: en.add.fromLink },
    { value: 'paste', label: en.add.pasteText },
  ]

  return (
    <>
      <PageHeader title={en.add.title} body={en.add.body} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={en.add.title} className="inline-flex rounded-xl border border-line bg-surface p-1">
          {modes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`min-h-10 rounded-lg px-4 text-sm font-medium transition-colors ${mode === value ? 'bg-river-soft text-river' : 'text-muted hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <Link to="/starter" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-river hover:underline">
          <BookOpenText className="size-4" aria-hidden />
          {en.add.browseStarter}
        </Link>
      </div>
      {mode === 'link' ? <ImportLinkForm /> : <PasteForm />}
    </>
  )
}
