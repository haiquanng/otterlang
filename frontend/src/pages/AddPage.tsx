import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpenText } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/Button'
import { KindPicker } from '@/components/KindPicker'
import { PageHeader } from '@/components/PageHeader'
import { TextAreaField } from '@/components/TextAreaField'
import { TextField } from '@/components/TextField'
import { en } from '@/i18n/en'
import { createSource } from '@/lib/api'
import { MAX_SOURCE_CHARS, type SourceKind } from '@/lib/schemas'

export function AddPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<SourceKind>('tech_blog')
  const [url, setUrl] = useState('')
  const [body, setBody] = useState('')

  const mutation = useMutation({
    mutationFn: () => createSource({ title: title.trim(), kind, url: url.trim(), body }),
    onSuccess: async (source) => {
      await queryClient.invalidateQueries({ queryKey: ['sources'] })
      // Straight to picking words: that is why the user pasted the text.
      navigate(`/documents/${source.id}/words`)
    },
  })

  const tooLong = body.length > MAX_SOURCE_CHARS
  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !tooLong

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (canSubmit) mutation.mutate()
  }

  return (
    <>
      <PageHeader title={en.add.title} body={en.add.body} />
      <Link to="/starter" className="mb-6 -mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-river hover:underline">
        <BookOpenText className="size-4" aria-hidden />
        {en.add.browseStarter}
      </Link>
      <form onSubmit={onSubmit} className="space-y-5">
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
    </>
  )
}
