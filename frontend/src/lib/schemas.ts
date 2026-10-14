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

export const healthSchema = z.object({ status: z.literal('ok') })

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
