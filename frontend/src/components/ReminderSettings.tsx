import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing } from 'lucide-react'
import { useState } from 'react'
import { en } from '@/i18n/en'
import { ApiError, getMe, updateMe, type MeUpdate } from '@/lib/api'
import {
  currentPushSupport,
  NoServiceWorkerError,
  sendTestNotification,
  subscribeThisDevice,
  unsubscribeThisDevice,
} from '@/lib/push'

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const hourLabel = new Intl.DateTimeFormat(undefined, { hour: 'numeric', timeZone: 'UTC' })
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

function problem(error: unknown): string {
  if (error instanceof NoServiceWorkerError) return en.settings.reminderNeedsApp
  if (error instanceof ApiError && error.status === 404) return en.settings.reminderNotConfigured
  if (error instanceof ApiError && error.status === 503) return en.settings.reminderMisconfigured
  if (error instanceof Error && error.message === 'denied') return en.settings.reminderDenied
  return en.common.loadError
}

export function ReminderSettings() {
  const queryClient = useQueryClient()
  const [support] = useState(currentPushSupport)
  const me = useQuery({ queryKey: ['me'], queryFn: getMe })
  const save = (update: MeUpdate) =>
    updateMe(update).then((user) => queryClient.setQueryData(['me'], user))

  const toggle = useMutation({
    mutationFn: async (on: boolean) => {
      if (on) {
        if ((await Notification.requestPermission()) !== 'granted') throw new Error('denied')
        await subscribeThisDevice()
        await save({ reminder_enabled: true, timezone })
      } else {
        await unsubscribeThisDevice().catch(() => undefined)
        await save({ reminder_enabled: false })
      }
    },
  })
  const setHour = useMutation({ mutationFn: (hour: number) => save({ reminder_hour: hour, timezone }) })
  const test = useMutation({ mutationFn: sendTestNotification })
  const enabled = me.data?.reminder_enabled ?? false

  return (
    <section className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BellRing className="size-5 text-muted" aria-hidden />
          <div>
            <p className="font-medium" id="reminder-label">
              {en.settings.reminder}
            </p>
            <p className="text-sm text-muted">{en.settings.reminderHint}</p>
          </div>
        </div>
        {support === 'supported' ? (
          <div className="flex items-center gap-2">
            {enabled ? (
              <select
                aria-label={en.settings.reminderHour}
                value={me.data?.reminder_hour ?? 19}
                onChange={(e) => setHour.mutate(Number(e.target.value))}
                className="min-h-10 rounded-lg border border-line bg-paper px-2 text-sm"
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hourLabel.format(Date.UTC(2026, 0, 1, hour))}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-labelledby="reminder-label"
              disabled={me.isPending || toggle.isPending}
              onClick={() => toggle.mutate(!enabled)}
              className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-60 ${enabled ? 'bg-river' : 'bg-line'}`}
            >
              <span className={`absolute top-1 left-1 size-5 rounded-full bg-surface shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        ) : null}
      </div>
      {support === 'install-first' ? <p className="mt-2 text-sm text-muted">{en.settings.reminderInstallFirst}</p> : null}
      {support === 'unsupported' ? <p className="mt-2 text-sm text-muted">{en.settings.reminderUnsupported}</p> : null}
      {support === 'supported' && enabled ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={test.isPending}
            onClick={() => test.mutate()}
            className="min-h-10 rounded-lg border border-line px-3 text-sm font-medium disabled:opacity-60"
          >
            {en.settings.reminderTest}
          </button>
          {test.isSuccess ? (
            <p role="status" className="text-sm text-muted">
              {test.data.sent > 0 ? en.settings.reminderTestSent : en.settings.reminderTestFailed}
            </p>
          ) : null}
          {test.isError ? <p role="alert" className="text-sm text-danger">{problem(test.error)}</p> : null}
        </div>
      ) : null}
      {toggle.isError ? <p role="alert" className="mt-2 text-sm text-danger">{problem(toggle.error)}</p> : null}
    </section>
  )
}
