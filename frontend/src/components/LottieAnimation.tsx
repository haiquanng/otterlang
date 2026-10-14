import { useEffect, useRef } from 'react'

const sources = {
  books: () => import('@/animations/books.json'),
  'search-file': () => import('@/animations/search-file.json'),
  success: () => import('@/animations/success.json'),
  'sleeping-panda': () => import('@/animations/sleeping-panda.json'),
}

export type AnimationName = keyof typeof sources

type Props = {
  name: AnimationName
  className?: string
  loop?: boolean
}

/**
 * Decorative Lottie animation (LottieFiles, Lottie Simple License; see animations/CREDITS.md).
 * The player and the JSON load lazily so screens without animation stay light, and
 * people who prefer reduced motion get a still frame.
 */
export function LottieAnimation({ name, className = '', loop = true }: Props) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let destroyed = false
    let stop: (() => void) | undefined
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    void Promise.all([import('lottie-web/build/player/lottie_light'), sources[name]()]).then(
      ([player, data]) => {
        if (destroyed || !container.current) return
        const animation = player.default.loadAnimation({
          container: container.current,
          renderer: 'svg',
          loop,
          autoplay: !reduceMotion,
          animationData: data.default,
        })
        if (reduceMotion) animation.goToAndStop(Math.floor(animation.totalFrames / 2), true)
        stop = () => animation.destroy()
      },
    )
    return () => {
      destroyed = true
      stop?.()
    }
  }, [name, loop])

  return <div ref={container} aria-hidden className={className} />
}
