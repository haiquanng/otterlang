import { en } from '@/i18n/en'
import { barFractions, goalFraction, weekdayLetter } from '@/lib/progress'
import type { Today } from '@/lib/todayApi'

const RADIUS = 34
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Progress ring toward the daily goal plus the last seven days. No streaks. */
export function DailyProgress({ today }: { today: Today }) {
  const done = goalFraction(today.reviewed_today, today.daily_goal)
  const bars = barFractions(today.week.map((d) => d.reviews))

  return (
    <section className="flex flex-wrap items-center gap-6 rounded-2xl border border-line bg-surface p-4">
      <div className="relative size-20 shrink-0" role="img" aria-label={en.today.goalAria(today.reviewed_today, today.daily_goal)}>
        <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
          <circle cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="8" className="stroke-line" />
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - done)}
            className="stroke-river transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
          {today.reviewed_today}/{today.daily_goal}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold">{done >= 1 ? en.today.goalDone : en.today.goalTitle}</p>
        <p className="text-sm text-muted">{en.today.goalBody(today.reviewed_today, today.daily_goal)}</p>
        <ol className="mt-3 flex h-12 items-end gap-1.5" aria-label={en.today.weekAria}>
          {today.week.map((day, i) => (
            <li key={day.day} className="flex flex-1 flex-col items-center gap-1" title={`${day.day}: ${day.reviews}`}>
              <span
                className={`w-full rounded-sm ${i === today.week.length - 1 ? 'bg-river' : 'bg-river/40'}`}
                style={{ height: `${Math.max(4, (bars[i] ?? 0) * 36)}px` }}
              />
              <span className="text-[10px] text-muted">{weekdayLetter(day.day)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
