import { useId, type InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export function TextField({ label, className = '', ...rest }: Props) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        {...rest}
        className="block h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-muted/70 focus:border-river focus:outline-none focus:ring-3 focus:ring-river/20"
      />
    </div>
  )
}
