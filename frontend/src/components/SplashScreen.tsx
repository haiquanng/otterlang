import { Button } from '@/components/Button'
import { useDelayedFlag } from '@/hooks/useDelayedFlag'
import { en } from '@/i18n/en'

type Props = {
  failed: boolean
  onRetry: () => void
}

export function SplashScreen({ failed, onRetry }: Props) {
  const slow = useDelayedFlag(!failed, 2500)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <img src="/logo.png" alt="" className={`size-16 ${failed ? '' : 'animate-pulse'}`} />
      {failed ? (
        <>
          <p className="max-w-xs text-muted">{en.session.unreachable}</p>
          <Button onClick={onRetry}>{en.common.retry}</Button>
        </>
      ) : (
        <p className={`max-w-xs text-sm text-muted transition-opacity ${slow ? 'opacity-100' : 'opacity-0'}`}>
          {en.session.waking}
        </p>
      )}
    </div>
  )
}
