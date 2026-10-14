import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '@/hooks/useSession'

export function RequireAuth() {
  const session = useSession()
  const location = useLocation()

  if (session.status !== 'signed-in') {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
