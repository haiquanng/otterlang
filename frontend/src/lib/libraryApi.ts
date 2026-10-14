import { z } from 'zod'
import { request } from '@/lib/http'
import { sourceKindSchema, type SourceKind } from '@/lib/schemas'

const libraryDocumentSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  kind: sourceKindSchema,
  source_name: z.string(),
  license: z.string().nullable(),
  word_count: z.number().int(),
  source_id: z.uuid().nullable(),
})
export type LibraryDocument = z.infer<typeof libraryDocumentSchema>

export function listLibraryDocuments(kind?: SourceKind) {
  return request(`/library-documents${kind ? `?kind=${kind}` : ''}`, z.array(libraryDocumentSchema))
}

export function addLibraryDocument(id: string) {
  return request(`/library-documents/${encodeURIComponent(id)}/add`, z.object({ source_id: z.uuid() }), {
    method: 'POST',
  })
}
