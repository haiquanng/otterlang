import { z } from 'zod'
import { request } from '@/lib/http'

export const practiceSentenceSchema = z.object({
  id: z.uuid(),
  item_id: z.uuid(),
  term: z.string(),
  sentence: z.string(),
  mine: z.boolean(),
})
export type PracticeSentence = z.infer<typeof practiceSentenceSchema>

export function getPracticeSentences(limit = 10) {
  return request(`/speaking/sentences?limit=${limit}`, z.array(practiceSentenceSchema))
}
