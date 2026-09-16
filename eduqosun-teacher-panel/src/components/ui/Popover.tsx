import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { useOnClickOutside } from '../../hooks/useDom'
import { useFloating, type FloatingPlacement } from '../../hooks/useFloating'

interface PopoverProps {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement>
  children: ReactNode
  placement?: FloatingPlacement
  className?: string
  label: string
}

/** Langar elementga bog'langan suzuvchi panel (bildirishnomalar, profil, sana tanlash) */
export function Popover({ open, onClose, anchorRef, children, placement = 'bottom-end', className, label }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFloating(anchorRef, panelRef, open, placement)
  useOnClickOutside([anchorRef, panelRef], onClose, open)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        anchorRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, anchorRef])

  if (!open) return null
  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={label}
      className={cn(
        'fixed z-[80] animate-menu-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift dark:border-slate-700 dark:bg-slate-800',
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  )
}
