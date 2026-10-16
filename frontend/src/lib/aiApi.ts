import { z } from 'zod'
import { request } from '@/lib/http'

export const writingFeedbackSchema = z.object({
  word_used_correctly: z.boolean(),
  natural_version: z.string(),
  tip: z.string(),
})
export type WritingFeedback = z.infer<typeof writingFeedbackSchema>

export function getWritingFeedback(cardId: string, sentence: string) {
  return request('/ai/feedback', writingFeedbackSchema, { method: 'POST', body: { card_id: cardId, sentence } })
}
