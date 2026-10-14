import * as AlertDialog from '@radix-ui/react-alert-dialog'
import type { ReactNode } from 'react'
import { Button } from '@/components/Button'
import { en } from '@/i18n/en'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  /** Keeps the dialog open with a spinner while the action runs. */
  loading?: boolean
  tone?: 'danger' | 'default'
  /** Optional element that opens the dialog; omit to control it with `open` only. */
  trigger?: ReactNode
}

/**
 * The app's only way to ask "are you sure?". Native confirm() is banned by lint (no-alert):
 * it cannot be styled, ignores the theme, and blocks the page.
 * Radix handles focus trapping, Escape, and screen-reader roles.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading = false,
  tone = 'default',
  trigger,
}: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      {trigger ? <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger> : null}
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_150ms_ease-out] motion-reduce:animate-none" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-6 shadow-xl focus:outline-none data-[state=open]:animate-[dialog-in_150ms_ease-out] motion-reduce:animate-none">
          <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-muted">{description}</AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={loading}>
                {en.common.cancel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={tone === 'danger' ? 'danger-solid' : 'primary'}
                loading={loading}
                onClick={(event) => {
                  // Stay open until the caller finishes; it closes the dialog on success.
                  event.preventDefault()
                  onConfirm()
                }}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
