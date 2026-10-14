import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/Button'
import { ErrorState } from '@/components/ErrorState'
import { KindBadge } from '@/components/KindBadge'
import { en } from '@/i18n/en'
import { ApiError, deleteSource, getSource } from '@/lib/api'
import { formatDate, readingMinutes } from '@/lib/format'

export function DocumentPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['sources', id], queryFn: () => getSource(id) })
  const remove = useMutation({
    mutationFn: () => deleteSource(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sources'] })
      navigate('/documents', { replace: true })
    },
  })

  function onDelete() {
    if (window.confirm(en.documents.deleteConfirm)) remove.mutate()
  }

  const back = (
    <Link to="/documents" className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
      <ArrowLeft className="size-4" aria-hidden />
      {en.documents.back}
    </Link>
  )

  if (query.isPending) {
    return (
      <div aria-busy>
        {back}
        <div className="h-9 w-2/3 animate-pulse rounded-lg bg-surface" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-surface" />
      </div>
    )
  }
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404
    return (
      <>
        {back}
        <ErrorState message={missing ? en.documents.notFound : undefined} onRetry={missing ? undefined : () => void query.refetch()} />
      </>
    )
  }

  const source = query.data
  return (
    <article>
      {back}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{source.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
          <KindBadge kind={source.kind} />
          <span>{en.documents.minutes(readingMinutes(source.body.length))}</span>
          <span>{formatDate(source.created_at)}</span>
          {source.url ? (
            <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-river hover:underline">
              {en.documents.openSource}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
      </header>

      <div className="max-w-[68ch] whitespace-pre-wrap font-reading text-[17px] leading-[1.75] md:text-lg">{source.body}</div>

      <footer className="mt-12 border-t border-line pt-6">
        <Button variant="danger" loading={remove.isPending} onClick={onDelete}>
          <Trash2 className="size-4" aria-hidden />
          {en.common.delete}
        </Button>
      </footer>
    </article>
  )
}
