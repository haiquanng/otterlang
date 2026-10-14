import { z } from 'zod'
import { request } from '@/lib/http'

const lookupSchema = z.object({
  word: z.string(),
  lemma: z.string(),
  definition: z.string().nullable(),
  phonetic: z.string().nullable(),
  pos: z.string().nullable(),
  rank: z.number().int().nullable(),
  status: z.enum(['saved', 'known', 'new']),
  item_id: z.uuid().nullable(),
})
export type Lookup = z.infer<typeof lookupSchema>

export function lookupWord(word: string) {
  return request(`/lookup?word=${encodeURIComponent(word)}`, lookupSchema)
}

export function getAnnotations(sourceId: string) {
  return request(
    `/sources/${encodeURIComponent(sourceId)}/annotations`,
    z.object({ saved: z.record(z.string(), z.uuid()) }),
  )
}
