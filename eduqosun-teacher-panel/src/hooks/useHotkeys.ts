import { useEffect, useRef } from 'react'

export interface Hotkey {
  /** Masalan: 'k', '/', '?', 'Escape' */
  key: string
  ctrlOrMeta?: boolean
  shift?: boolean
  alt?: boolean
  /** Yozuv maydonida ham ishlasinmi (standart: yo'q) */
  allowInInput?: boolean
  handler: (event: KeyboardEvent) => void
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/** Global klaviatura yorliqlari */
export function useHotkeys(hotkeys: Hotkey[], enabled = true): void {
  const ref = useRef(hotkeys)
  ref.current = hotkeys

  useEffect(() => {
    if (!enabled) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      for (const hotkey of ref.current) {
        if (event.key.toLowerCase() !== hotkey.key.toLowerCase()) continue
        if (!!hotkey.ctrlOrMeta !== (event.ctrlKey || event.metaKey)) continue
        if (hotkey.alt !== undefined && hotkey.alt !== event.altKey) continue
        if (hotkey.shift !== undefined && hotkey.shift !== event.shiftKey) continue
        if (!hotkey.allowInInput && !hotkey.ctrlOrMeta && isTypingTarget(event.target)) continue
        hotkey.handler(event)
        break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
