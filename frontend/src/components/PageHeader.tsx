import type { ReactNode } from 'react'

type Props = {
  title: string
  body?: string
  /** Optional control on the right of the title, e.g. a link to a related page. */
  action?: ReactNode
}

export function PageHeader({ title, body, action }: Props) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {body ? <p className="mt-2 max-w-prose text-muted">{body}</p> : null}
      </div>
      {action}
    </header>
  )
}
