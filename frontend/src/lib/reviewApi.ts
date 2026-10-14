import { z } from 'zod'
import { request } from '@/lib/http'

export const reviewCardSchema = z.object({
  id: z.uuid(),
  item_id: z.uuid(),
  card_type: z.enum(['cloze', 'define_to_word', 'word_in_use', 'write_sentence']),
  prompt: z.string(),
  hint: z.string().nullable(),
  is_new: z.boolean(),
})
export type ReviewCard = z.infer<typeof reviewCardSchema>

export const checkSchema = z.object({
  correct: z.boolean(),
  close: z.boolean(),
  expected: z.string(),
  sentence: z.string().nullable(),
  definition: z.string().nullable(),
  suggested_rating: z.number().int().min(1).max(4),
})
export type CheckResult = z.infer<typeof checkSchema>

export type Rating = 1 | 2 | 3 | 4

const answerSchema = z.object({ due: z.string(), state: z.string() })

export function getDueCards(limit = 20) {
  return request(`/review/due?limit=${limit}`, z.array(reviewCardSchema))
}

export function checkCard(id: string, answer: string, responseMs: number) {
  return request(`/review/${encodeURIComponent(id)}/check`, checkSchema, {
    method: 'POST',
    body: { answer, response_ms: responseMs },
  })
}

export function answerCard(id: string, rating: Rating, correct: boolean, responseMs: number) {
  return request(`/review/${encodeURIComponent(id)}/answer`, answerSchema, {
    method: 'POST',
    body: { rating, correct, response_ms: responseMs },
  })
}
