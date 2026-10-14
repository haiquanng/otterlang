import { useQuery } from '@tanstack/react-query'
import { Outlet } from 'react-router'
import { SplashScreen } from '@/components/SplashScreen'
import { useSession } from '@/hooks/useSession'
import { refreshSession } from '@/lib/api'

/** Restores the session from the refresh cookie once, before any route renders. */
export function SessionGate() {
  const session = useSession()
  const restore = useQuery({
    queryKey: ['session-restore'],
    queryFn: refreshSession,
    enabled: session.status === 'unknown',
    staleTime: Number.POSITIVE_INFINITY,
    // Network errors mean the free server is still waking; keep trying for about a minute.
    retry: 6,
    retryDelay: 5_000,
  })

  if (session.status === 'unknown') {
    return <SplashScreen failed={restore.isError} onRetry={() => void restore.refetch()} />
  }
  return <Outlet />
}
