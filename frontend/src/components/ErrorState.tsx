import { CloudOff } from 'lucide-react'
import { Button } from '@/components/Button'
import { en } from '@/i18n/en'

type Props = {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = en.common.loadError, onRetry }: Props) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-10 text-center">
      <CloudOff className="mb-3 size-8 text-muted" aria-hidden />
      <p className="max-w-sm text-muted">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          {en.common.retry}
        </Button>
      ) : null}
    </div>
  )
}
