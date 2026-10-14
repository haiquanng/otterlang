import { ArrowRight, CalendarCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { en } from '@/i18n/en'
import type { Today } from '@/lib/todayApi'

const ctaClass =
  'mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl px-5 font-semibold shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2'

/** The one thing to do next: review, or add something to learn. */
export function TodayHero({ today }: { today: Today }) {
  if (today.total_words === 0) {
    return (
      <section className="rounded-3xl border border-line bg-surface p-6 md:p-8">
        <Sparkles className="size-8 text-otter" aria-hidden />
        <h2 className="mt-3 text-xl font-semibold md:text-2xl">{en.today.welcomeTitle}</h2>
        <p className="mt-1 max-w-prose text-muted">{en.today.welcomeBody}</p>
        <Link to="/add" className={`${ctaClass} bg-river text-on-river focus-visible:outline-river`}>
          {en.today.welcomeAction}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    )
  }

  if (today.due_now > 0) {
    return (
      <section className="rounded-3xl bg-river p-6 text-on-river md:p-8">
        <h2 className="text-2xl font-semibold md:text-3xl">{en.today.dueTitle(today.due_now)}</h2>
        <p className="mt-1 text-on-river/85">{en.today.dueBody}</p>
        <Link to="/review" className={`${ctaClass} bg-surface text-river focus-visible:outline-on-river`}>
          {en.today.startReview}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        {today.due_later_today > 0 ? (
          <p className="mt-4 text-sm text-on-river/80">{en.today.laterToday(today.due_later_today)}</p>
        ) : null}
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-line bg-surface p-6 md:p-8">
      <CalendarCheck className="size-8 text-river" aria-hidden />
      <h2 className="mt-3 text-xl font-semibold md:text-2xl">{en.today.caughtUpTitle}</h2>
      <p className="mt-1 text-muted">{en.today.caughtUpBody}</p>
      {today.due_later_today > 0 ? (
        <p className="mt-3 text-sm text-muted">{en.today.laterToday(today.due_later_today)}</p>
      ) : null}
    </section>
  )
}
