import { useMutation } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/Button'
import { useSession } from '@/hooks/useSession'
import { en } from '@/i18n/en'
import { signOut } from '@/lib/api'

export function AccountCard() {
  const session = useSession()
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: signOut,
    onSettled: () => navigate('/sign-in', { replace: true }),
  })

  if (session.status !== 'signed-in') return null
  const { user } = session

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium">{user.display_name ?? en.settings.account}</p>
        <p className="truncate text-sm text-muted">{user.email}</p>
      </div>
      <Button variant="danger" loading={mutation.isPending} onClick={() => mutation.mutate()}>
        <LogOut className="size-4" aria-hidden />
        {en.settings.signOut}
      </Button>
    </section>
  )
}
