import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { en } from '@/i18n/en'
import { getMe, updateMe } from '@/lib/api'

const GOALS = [10, 20, 30, 50]

export function DailyGoalPicker() {
  const queryClient = useQueryClient()
  const me = useQuery({ queryKey: ['me'], queryFn: getMe })
  const save = useMutation({
    mutationFn: (daily_goal: number) => updateMe({ daily_goal }),
    onSuccess: async (user) => {
      queryClient.setQueryData(['me'], user)
      await queryClient.invalidateQueries({ queryKey: ['today'] })
    },
  })
  const current = save.variables ?? me.data?.daily_goal

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <div>
        <p className="font-medium" id="goal-label">
          {en.settings.dailyGoal}
        </p>
        <p className="text-sm text-muted">{en.settings.dailyGoalHint}</p>
      </div>
      <div role="radiogroup" aria-labelledby="goal-label" className="inline-flex rounded-xl border border-line bg-paper p-1">
        {GOALS.map((goal) => (
          <button
            key={goal}
            type="button"
            role="radio"
            aria-checked={current === goal}
            disabled={me.isPending}
            onClick={() => save.mutate(goal)}
            className={`min-h-10 min-w-11 rounded-lg px-3 text-sm font-medium tabular-nums transition-colors ${current === goal ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            {goal}
          </button>
        ))}
      </div>
    </section>
  )
}
