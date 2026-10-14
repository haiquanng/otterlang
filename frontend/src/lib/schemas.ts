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
