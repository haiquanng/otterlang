import { Link2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/Button'
import { KindPicker } from '@/components/KindPicker'
import { TextField } from '@/components/TextField'
import { useAddDocument } from '@/hooks/useAddDocument'
import { en } from '@/i18n/en'
import { ApiError, importSource } from '@/lib/api'
import type { SourceKind } from '@/lib/schemas'

function errorMessage(error: unknown): string {
  // The API already explains 422/502/429 in plain English; anything else is generic.
  if (error instanceof ApiError && [422, 429, 502].includes(error.status)) return error.message
  return en.add.importError
}

export function ImportLinkForm() {
  const [url, setUrl] = useState('')
  const [kind, setKind] = useState<SourceKind>('tech_blog')
  const mutation = useAddDocument(() => importSource(url.trim(), kind))
  const canSubmit = /^https?:\/\/\S+\.\S+/.test(url.trim())

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (canSubmit) mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
      <TextField
        label={en.add.linkLabel}
        type="url"
        inputMode="url"
        placeholder={en.add.linkPlaceholder}
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <p className="-mt-3 text-sm text-muted">{en.add.linkHint}</p>
      <KindPicker label={en.add.kindLabel} value={kind} onChange={setKind} />
      {mutation.isError ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage(mutation.error)}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" className="w-full md:w-auto" loading={mutation.isPending} disabled={!canSubmit}>
          <Link2 className="size-4" aria-hidden />
          {mutation.isPending ? en.add.importing : en.add.import}
        </Button>
      </div>
    </form>
  )
}
