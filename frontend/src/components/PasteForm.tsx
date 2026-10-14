import { useState, type FormEvent } from 'react'
import { Button } from '@/components/Button'
import { KindPicker } from '@/components/KindPicker'
import { TextAreaField } from '@/components/TextAreaField'
import { TextField } from '@/components/TextField'
import { useAddDocument } from '@/hooks/useAddDocument'
import { en } from '@/i18n/en'
import { createSource } from '@/lib/api'
import { MAX_SOURCE_CHARS, type SourceKind } from '@/lib/schemas'

export function PasteForm() {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<SourceKind>('tech_blog')
  const [url, setUrl] = useState('')
  const [body, setBody] = useState('')
  const mutation = useAddDocument(() => createSource({ title: title.trim(), kind, url: url.trim(), body }))

  const tooLong = body.length > MAX_SOURCE_CHARS
  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !tooLong

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (canSubmit) mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
      <TextField
        label={en.add.titleLabel}
        placeholder={en.add.titlePlaceholder}
        maxLength={200}
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex flex-col gap-5 md:flex-row md:items-end">
        <KindPicker label={en.add.kindLabel} value={kind} onChange={setKind} />
        <TextField
          className="flex-1"
          label={`${en.add.urlLabel} (${en.common.optional})`}
          type="url"
          inputMode="url"
          placeholder={en.add.urlPlaceholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <TextAreaField
        label={en.add.bodyLabel}
        placeholder={en.add.bodyPlaceholder}
        limit={MAX_SOURCE_CHARS}
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {tooLong ? <p className="text-sm text-danger">{en.add.tooLong}</p> : null}
      {mutation.isError ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {en.add.saveError}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" className="w-full md:w-auto" loading={mutation.isPending} disabled={!canSubmit}>
          {mutation.isPending ? en.add.saving : en.add.submit}
        </Button>
      </div>
    </form>
  )
}
