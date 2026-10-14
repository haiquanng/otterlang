import { z } from 'zod'
import { request } from '@/lib/http'
import { sourceSummarySchema } from '@/lib/schemas'

const todaySchema = z.object({
  due_now: z.number().int(),
  due_later_today: z.number().int(),
  new_this_week: z.number().int(),
  total_words: z.number().int(),
  recent_documents: z.array(sourceSummarySchema),
})
export type Today = z.infer<typeof todaySchema>

export function getToday() {
  // "Later today" ends at the learner's local midnight, so the server needs their timezone.
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  return request(`/today?tz=${encodeURIComponent(tz)}`, todaySchema)
}

export function dayPart(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}
