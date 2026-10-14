import { useQuery } from '@tanstack/react-query'
import { en } from '@/i18n/en'
import { getHealth } from '@/lib/api'

export function ServerStatus() {
  // Render free tier sleeps; a slow first answer means waking, not broken.
  const { isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    retry: 3,
    retryDelay: 5_000,
  })

  const [label, dot] = isPending
    ? [en.settings.serverWaking, 'bg-otter animate-pulse']
    : isError
      ? [en.settings.serverDown, 'bg-danger']
      : [en.settings.serverOnline, 'bg-river']

  return (
    <section className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex min-h-8 items-center justify-between gap-4">
        <span className="font-medium">{en.settings.server}</span>
        <span className="flex items-center gap-2 text-sm text-muted">
          <span className={`size-2.5 rounded-full ${dot}`} aria-hidden />
          {label}
        </span>
      </div>
      {isPending ? <p className="mt-1 text-sm text-muted">{en.settings.serverWakingHint}</p> : null}
    </section>
  )
}
