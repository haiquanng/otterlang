import { useEffect } from 'react'
import { en } from '@/i18n/en'
import type { Toast } from '@/hooks/usePickWords'

const VISIBLE_MS = 5000

type Props = {
  toast: Toast | null
  onDismiss: () => void
}

export function UndoToast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onDismiss, VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div
      role="status"
      key={toast.id}
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-md items-center justify-between gap-4 rounded-xl bg-ink px-4 py-3 text-sm text-paper shadow-lg md:bottom-6"
    >
      <span className="min-w-0 truncate">{toast.message}</span>
      <button
        type="button"
        className="min-h-9 shrink-0 rounded-lg px-2 font-semibold text-river-soft hover:underline focus-visible:outline-2 focus-visible:outline-paper"
        onClick={() => {
          toast.undo()
          onDismiss()
        }}
      >
        {en.pick.undo}
      </button>
    </div>
  )
}
