import { useId, type TextareaHTMLAttributes } from 'react'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  value: string
  limit: number
}

export function TextAreaField({ label, value, limit, className = '', ...rest }: Props) {
  const id = useId()
  const counterId = `${id}-count`
  const over = value.length > limit

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        aria-describedby={counterId}
        aria-invalid={over || undefined}
        {...rest}
        className="block min-h-72 w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 font-reading text-[17px] leading-relaxed text-ink placeholder:font-sans placeholder:text-base placeholder:text-muted/70 focus:border-river focus:outline-none focus:ring-3 focus:ring-river/20 aria-invalid:border-danger"
      />
      <p id={counterId} className={`mt-1.5 text-right text-xs tabular-nums ${over ? 'text-danger' : 'text-muted'}`}>
        {value.length.toLocaleString()} / {limit.toLocaleString()}
      </p>
    </div>
  )
}
