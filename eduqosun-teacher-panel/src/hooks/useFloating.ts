import { useLayoutEffect, type RefObject } from 'react'

export type FloatingPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'

const GAP = 6
const EDGE = 8

/**
 * Suzuvchi panelni (menyu, popover) langar elementga nisbatan joylashtiradi.
 * Pastda joy yetmasa — yuqoriga ochiladi; ekran chetidan chiqib ketmaydi.
 * Panel portal orqali `body`ga chiziladi, shuning uchun `overflow: hidden` kartalar uni kesmaydi.
 */
export function useFloating(
  anchorRef: RefObject<HTMLElement>,
  floatingRef: RefObject<HTMLElement>,
  open: boolean,
  placement: FloatingPlacement = 'bottom-end',
  matchWidth = false,
): void {
  useLayoutEffect(() => {
    if (!open) return undefined
    const anchor = anchorRef.current
    const floating = floatingRef.current
    if (!anchor || !floating) return undefined

    const update = () => {
      const a = anchor.getBoundingClientRect()
      if (matchWidth) floating.style.minWidth = `${a.width}px`
      const f = floating.getBoundingClientRect()
      const viewportW = window.innerWidth
      const viewportH = window.innerHeight

      const wantsTop = placement.startsWith('top')
      const spaceBelow = viewportH - a.bottom
      const spaceAbove = a.top
      const openTop = wantsTop ? spaceAbove >= f.height + GAP || spaceAbove > spaceBelow : spaceBelow < f.height + GAP && spaceAbove > spaceBelow

      let top = openTop ? a.top - f.height - GAP : a.bottom + GAP
      top = Math.max(EDGE, Math.min(top, viewportH - f.height - EDGE))

      let left = placement.endsWith('end') ? a.right - f.width : a.left
      left = Math.max(EDGE, Math.min(left, viewportW - f.width - EDGE))

      floating.style.top = `${Math.round(top)}px`
      floating.style.left = `${Math.round(left)}px`
      floating.style.transformOrigin = openTop ? 'bottom' : 'top'
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const observer = new ResizeObserver(update)
    observer.observe(floating)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      observer.disconnect()
    }
  }, [anchorRef, floatingRef, open, placement, matchWidth])
}
