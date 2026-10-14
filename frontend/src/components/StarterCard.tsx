import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/Button'
import { KindBadge } from '@/components/KindBadge'
import { en } from '@/i18n/en'
import { readingMinutes } from '@/lib/format'
import { addLibraryDocument, type LibraryDocument } from '@/lib/libraryApi'

const WORD_CHARS = 6

export function StarterCard({ doc }: { doc: LibraryDocument }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const add = useMutation({
    mutationFn: () => addLibraryDocument(doc.id),
    onSuccess: async ({ source_id }) => {
      await Promise.all(
        ['sources', 'library-documents', 'today'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
      )
      // Read first; the reading view has the Pick words button.
      navigate(`/documents/${source_id}`)
    },
  })

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-sm text-muted">
        <KindBadge kind={doc.kind} />
        <span>{en.documents.minutes(readingMinutes(doc.word_count * WORD_CHARS))}</span>
      </div>
      <h3 className="mt-2 font-semibold leading-snug">{doc.title}</h3>
      <p className="mt-1 text-xs text-muted">{en.starter.attribution(doc.source_name, doc.license)}</p>
      <div className="mt-auto pt-4">
        {doc.source_id ? (
          <Link
            to={`/documents/${doc.source_id}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:bg-paper"
          >
            {en.starter.open}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <Button variant="secondary" loading={add.isPending} onClick={() => add.mutate()} aria-label={`${en.starter.read}: ${doc.title}`}>
            {add.isPending ? en.starter.adding : en.starter.read}
          </Button>
        )}
        {add.isError ? <p role="alert" className="mt-2 text-sm text-danger">{en.starter.addError}</p> : null}
      </div>
    </article>
  )
}
