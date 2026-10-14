import { z } from 'zod'

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiGet<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { credentials: 'include' })
  if (!response.ok) throw new ApiError(response.status, `GET ${path} failed`)
  return schema.parse(await response.json())
}

const healthSchema = z.object({ status: z.literal('ok') })

export function getHealth() {
  return apiGet('/health', healthSchema)
}
