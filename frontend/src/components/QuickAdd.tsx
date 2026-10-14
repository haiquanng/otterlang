import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/Button'
import { en } from '@/i18n/en'
import { createItem } from '@/lib/api'

export function QuickAdd() {
  const queryClient = useQueryClient()
  const [term, setTerm] = useState('')
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: (value: string) => createItem({ term: value }),
    onSuccess: async (item) => {
      setTerm('')
      setLastAdded(item.term)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: ['today'] }),
      ])
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (term.trim()) mutation.mutate(term.trim())
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-3">
      <label htmlFor="quick-add" className="sr-only">
        {en.library.quickAddLabel}
      </label>
      <div className="flex gap-2">
        <input
          id="quick-add"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value)
            setLastAdded(null)
          }}
          maxLength={120}
          placeholder={en.library.quickAddPlaceholder}
          autoComplete="off"
          autoCapitalize="none"
          className="h-11 min-w-0 flex-1 rounded-xl bg-paper px-4 text-base placeholder:text-muted/70 focus:outline-none focus:ring-3 focus:ring-river/20"
        />
        <Button type="submit" loading={mutation.isPending} disabled={!term.trim()}>
          <Plus className="size-4" aria-hidden />
          {en.library.quickAdd}
        </Button>
      </div>
      <p role="status" className="min-h-5 px-1 pt-1 text-sm">
        {mutation.isError ? (
          <span className="text-danger">{en.library.addError}</span>
        ) : lastAdded ? (
          <span className="text-river">{en.library.added(lastAdded)}</span>
        ) : null}
      </p>
    </form>
  )
}
