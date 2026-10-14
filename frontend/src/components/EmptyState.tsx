import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { LottieAnimation, type AnimationName } from '@/components/LottieAnimation'

type Props = {
  icon: LucideIcon
  title: string
  body: string
  action?: { to: string; label: string }
  /** Replaces the icon with a short Lottie animation. */
  animation?: AnimationName
  loop?: boolean
}

export function EmptyState({ icon: Icon, title, body, action, animation, loop }: Props) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      {animation ? (
        <LottieAnimation name={animation} loop={loop} className="mb-2 size-36" />
      ) : (
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-otter-soft text-otter">
          <Icon className="size-7" aria-hidden />
        </span>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-muted">{body}</p>
      {action ? (
        <Link
          to={action.to}
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-river px-5 text-sm font-semibold text-on-river shadow-sm hover:opacity-90"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
