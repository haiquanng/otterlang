import { useEffect, useState } from 'react'

/** True once `active` has stayed true for `delayMs`. Used to show "waking up" hints only when slow. */
export function useDelayedFlag(active: boolean, delayMs: number) {
  const [elapsed, setElapsed] = useState(false)

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setElapsed(true), delayMs)
    return () => {
      clearTimeout(timer)
      setElapsed(false)
    }
  }, [active, delayMs])

  return active && elapsed
}
