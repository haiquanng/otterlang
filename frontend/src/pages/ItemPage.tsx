import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ArrowLeft, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/Button'
import { ErrorState } from '@/components/ErrorState'
import { HighlightedSentence } from '@/components/HighlightedSentence'
import { ItemEditor } from '@/components/ItemEditor'
import { WordLookup } from '@/components/WordLookup'
import { en } from '@/i18n/en'
import { ApiError, deleteItem, getItem, updateItem } from '@/lib/api'

export function ItemPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['items', id], queryFn: () => getItem(id) })

  const leave = async () => {
    await queryClient.invalidateQueries({ queryKey: ['items'] })
    navigate('/library', { replace: true })
  }
  const remove = useMutation({ mutationFn: () => deleteItem(id), onSuccess: leave })
  const archive = useMutation({ mutationFn: () => updateItem(id, { status: 'archived' }), onSuccess: leave })

  const back = (
    <Link to="/library" className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
      <ArrowLeft className="size-4" aria-hidden />
      {en.item.back}
    </Link>
  )

  if (query.isPending) {
    return (
      <div aria-busy>
        {back}
        <div className="h-10 w-1/2 animate-pulse rounded-lg bg-surface" />
        <div className="mt-6 h-48 animate-pulse rounded-2xl bg-surface" />
      </div>
    )
  }
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404
    return (
      <>
        {back}
        <ErrorState message={missing ? en.item.notFound : undefined} onRetry={missing ? undefined : () => void query.refetch()} />
      </>
    )
  }

  const item = query.data
  return (
    <article>
      {back}
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{item.term}</h1>
        {item.phonetic ? <p className="mt-1 text-muted">{item.phonetic}</p> : null}
        <div className="mt-4">
          <WordLookup term={item.term} />
        </div>
      </header>

      {item.contexts.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-medium text-muted">{en.item.contexts}</h2>
          <ul className="space-y-2">
            {item.contexts.map((context) => (
              <li key={context.sentence} className="rounded-2xl border border-line bg-surface px-4 py-3">
                <HighlightedSentence sentence={context.sentence} word={context.surface ?? item.term} />
                {context.source_id ? (
                  <Link to={`/documents/${context.source_id}`} className="mt-1 inline-block text-sm text-river hover:underline">
                    {context.source_title}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ItemEditor key={item.id} item={item} />

      <footer className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
        <Button variant="secondary" loading={archive.isPending} onClick={() => archive.mutate()}>
          <Archive className="size-4" aria-hidden />
          {en.item.archive}
        </Button>
        <Button variant="danger" loading={remove.isPending} onClick={() => window.confirm(en.item.deleteConfirm) && remove.mutate()}>
          <Trash2 className="size-4" aria-hidden />
          {en.common.delete}
        </Button>
      </footer>
    </article>
  )
}
