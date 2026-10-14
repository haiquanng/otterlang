import { z } from 'zod'

export const userSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  display_name: z.string().nullable(),
  skip_top_n: z.number().int(),
})
export type User = z.infer<typeof userSchema>

export const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('bearer'),
  user: userSchema,
})

export const sourceKinds = ['tech_blog', 'ielts', 'other'] as const
export const sourceKindSchema = z.enum(sourceKinds)
export type SourceKind = z.infer<typeof sourceKindSchema>

export const MAX_SOURCE_CHARS = 50_000

export const sourceSummarySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  kind: sourceKindSchema,
  url: z.string().nullable(),
  char_count: z.number().int(),
  created_at: z.string(),
})
export type SourceSummary = z.infer<typeof sourceSummarySchema>

export const sourceSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  kind: sourceKindSchema,
  url: z.string().nullable(),
  body: z.string(),
  created_at: z.string(),
})
export type Source = z.infer<typeof sourceSchema>

export type SourceInput = Pick<Source, 'title' | 'kind' | 'body'> & { url: string }

export const candidateSchema = z.object({
  lemma: z.string(),
  surface: z.string(),
  sentence: z.string(),
  rank: z.number().int().nullable(),
  count: z.number().int(),
})
export type Candidate = z.infer<typeof candidateSchema>

export const addedSchema = z.object({ added: z.number().int() })

export const tags = ['technical', 'ielts', 'general'] as const
export const tagSchema = z.enum(tags)
export type Tag = z.infer<typeof tagSchema>

export const itemSchema = z.object({
  id: z.uuid(),
  type: z.enum(['word', 'collocation', 'pattern']),
  term: z.string(),
  lemma: z.string(),
  definition: z.string().nullable(),
  note: z.string().nullable(),
  status: z.enum(['active', 'archived']),
  tags: z.array(tagSchema),
  sentence: z.string().nullable().optional(),
  created_at: z.string(),
})
export type Item = z.infer<typeof itemSchema>

export const itemDetailSchema = itemSchema.extend({
  phonetic: z.string().nullable(),
  contexts: z.array(
    z.object({
      sentence: z.string(),
      surface: z.string().nullable(),
      source_id: z.uuid().nullable(),
      source_title: z.string().nullable(),
    }),
  ),
})
export type ItemDetail = z.infer<typeof itemDetailSchema>

export type ItemInput = {
  term: string
  surface?: string
  sentence?: string
  source_id?: string
  tags?: Tag[]
}

export type ItemUpdate = Partial<Pick<Item, 'definition' | 'note' | 'tags' | 'status'>>

export type ItemFilters = { q?: string; tag?: Tag }
