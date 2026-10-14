import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/Button'
import { en } from '@/i18n/en'
import { updateItem } from '@/lib/api'
import { tags as allTags, type ItemDetail, type Tag } from '@/lib/schemas'

const fieldClass =
  'block w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-river focus:outline-none focus:ring-3 focus:ring-river/20'

export function ItemEditor({ item }: { item: ItemDetail }) {
  const queryClient = useQueryClient()
  const [definition, setDefinition] = useState(item.definition ?? '')
  const [note, setNote] = useState(item.note ?? '')
  const [tags, setTags] = useState<Tag[]>(item.tags)
  const mutation = useMutation({
    mutationFn: () =>
      updateItem(item.id, { definition: definition.trim() || null, note: note.trim() || null, tags }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(['items', item.id], updated)
      await queryClient.invalidateQueries({ queryKey: ['items'], exact: false })
    },
  })

  function toggle(tag: Tag) {
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]))
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="definition" className="mb-1.5 block text-sm font-medium">
          {en.item.definition}
        </label>
        <textarea id="definition" rows={3} maxLength={500} value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder={en.item.definitionPlaceholder} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
          {en.item.note}
        </label>
        <textarea id="note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={en.item.notePlaceholder} className={fieldClass} />
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">{en.item.tags}</legend>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={tags.includes(tag)}
              onClick={() => toggle(tag)}
              className={`min-h-9 rounded-full border px-4 text-sm font-medium ${tags.includes(tag) ? 'border-river bg-river-soft text-river' : 'border-line bg-surface text-muted'}`}
            >
              {en.tags[tag]}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={mutation.isPending}>
          {en.item.save}
        </Button>
        <span role="status" className="text-sm">
          {mutation.isError ? <span className="text-danger">{en.common.loadError}</span> : mutation.isSuccess ? <span className="text-river">{en.item.saved}</span> : null}
        </span>
      </div>
    </form>
  )
}
