import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { useDelayedFlag } from '@/hooks/useDelayedFlag'
import { useSession } from '@/hooks/useSession'
import { en } from '@/i18n/en'
import { ApiError, signIn } from '@/lib/api'

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return en.signIn.wrongCredentials
    if (error.status === 429) return en.signIn.tooManyAttempts
    if (error.status === 422) return en.signIn.invalidEmail
    return en.signIn.genericError
  }
  return en.session.unreachable
}

function redirectTarget(state: unknown): string {
  if (state && typeof state === 'object' && 'from' in state && typeof state.from === 'string') {
    return state.from
  }
  return '/'
}

export function SignInPage() {
  const session = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const target = redirectTarget(location.state)

  const mutation = useMutation({
    mutationFn: () => signIn(email, password),
    onSuccess: () => navigate(target, { replace: true }),
  })
  const slow = useDelayedFlag(mutation.isPending, 3000)

  if (session.status === 'signed-in' && !mutation.isPending) return <Navigate to={target} replace />

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-river-soft blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/favicon.svg" alt="" className="mb-4 size-14" />
          <h1 className="text-2xl font-semibold tracking-tight">{en.signIn.title}</h1>
          <p className="mt-1 text-muted">{en.signIn.subtitle}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm" noValidate>
          <TextField
            label={en.signIn.email}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label={en.signIn.password}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mutation.isError ? (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              {errorMessage(mutation.error)}
            </p>
          ) : null}
          <Button type="submit" className="w-full" loading={mutation.isPending} disabled={!email || !password}>
            {mutation.isPending ? en.signIn.submitting : en.signIn.submit}
          </Button>
          {slow ? <p className="text-center text-sm text-muted">{en.session.waking}</p> : null}
        </form>

        <p className="mt-6 text-center text-sm text-muted">{en.signIn.inviteOnly}</p>
      </div>
    </main>
  )
}
