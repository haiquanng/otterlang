import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { Source } from '@/lib/schemas'

/** Save a new document, then open it in the reading view (tap words to learn them). */
export function useAddDocument(save: () => Promise<Source>) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: save,
    onSuccess: async (source) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sources'] }),
        queryClient.invalidateQueries({ queryKey: ['today'] }),
      ])
      navigate(`/documents/${source.id}`)
    },
  })
}
