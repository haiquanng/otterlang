import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/components/Button'
import { en } from '@/i18n/en'

/** Replaces React Router's developer error screen with something a learner can act on. */
export function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <img src="/favicon.svg" alt="" className="size-14" />
      <h1 className="text-2xl font-semibold tracking-tight">
        {notFound ? en.errors.notFoundTitle : en.errors.crashTitle}
      </h1>
      <p className="max-w-sm text-muted">{notFound ? en.errors.notFoundBody : en.errors.crashBody}</p>
      <div className="flex gap-2">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-xl bg-river px-5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          {en.errors.goHome}
        </Link>
        {notFound ? null : (
          <Button variant="secondary" onClick={() => window.location.reload()}>
            {en.errors.reload}
          </Button>
        )}
      </div>
    </main>
  )
}
