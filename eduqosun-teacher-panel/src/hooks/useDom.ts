import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/** Element tashqarisida bosilganda chaqiriladi */
export function useOnClickOutside(
  refs: RefObject<HTMLElement>[],
  handler: () => void,
  enabled = true,
): void {
  // Havolalar har renderda yangi massivda kelishi mumkin — obunani qayta yaratmaslik uchun ref'da saqlaymiz
  const latest = useRef({ refs, handler })
  latest.current = { refs, handler }

  useEffect(() => {
    if (!enabled) return undefined
    const listener = (event: PointerEvent) => {
      const target = event.target as Node
      if (latest.current.refs.some((ref) => ref.current?.contains(target))) return
      latest.current.handler()
    }
    document.addEventListener('pointerdown', listener)
    return () => document.removeEventListener('pointerdown', listener)
  }, [enabled])
}

/** Ochiq oyna bo'lganda sahifa aylanishini to'xtatadi (bir nechta oyna uchun hisoblagich bilan) */
let lockCount = 0
export function useLockBodyScroll(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined
    lockCount += 1
    if (lockCount === 1) {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
    }
    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }
    }
  }, [active])
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Fokusni oyna ichida ushlab turadi va yopilganda avvalgi elementga qaytaradi */
export function useFocusTrap(containerRef: RefObject<HTMLElement>, active: boolean): void {
  useEffect(() => {
    if (!active) return undefined
    const container = containerRef.current
    if (!container) return undefined
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusFirst = () => {
      const preferred = container.querySelector<HTMLElement>('[data-autofocus]')
      const first = preferred ?? container.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? container).focus({ preventScroll: true })
    }
    const frame = window.requestAnimationFrame(focusFirst)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    container.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      container.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [containerRef, active])
}

/** Media so'rov holati */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(query).matches))
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}

/** Element kengligini kuzatadi (jadval ustunlarini moslash uchun) */
export function useElementWidth<T extends HTMLElement>(): [RefObject<T>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return undefined
    setWidth(element.getBoundingClientRect().width)
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

/** Qiymatni kechiktirib yangilaydi (qidiruv uchun) */
export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

/** Oldingi render qiymati */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}
