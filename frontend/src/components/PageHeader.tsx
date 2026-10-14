type Props = {
  title: string
  body?: string
}

export function PageHeader({ title, body }: Props) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {body ? <p className="mt-2 max-w-prose text-muted">{body}</p> : null}
    </header>
  )
}
