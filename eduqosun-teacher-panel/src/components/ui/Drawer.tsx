import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useFocusTrap, useLockBodyScroll } from '../../hooks/useDom'

interface DrawerProps {
  open: boolean
  onClose: () => void
  /** Ekran o'quvchilari uchun sarlavha (ko'rinadigan sarlavha `header`da bo'lishi mumkin) */
  title: string
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
  bodyClassName?: string
}

/** O'ng tomondan chiqadigan panel (batafsil ma'lumot, tekshirish va h.k.) */
export function Drawer({ open, onClose, title, header, children, footer, size = 'md', bodyClassName }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useLockBodyScroll(open)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return undefined
    const panel = panelRef.current
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    panel?.addEventListener('keydown', onKeyDown)
    return () => panel?.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 animate-overlay-in bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex h-full w-full animate-slide-in-right flex-col bg-white shadow-overlay outline-none dark:bg-slate-800',
          size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700/60 sm:px-6">
          <div className="min-w-0 flex-1">
            {header ?? (
              <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
            )}
            {header ? (
              <h2 id={titleId} className="sr-only">
                {title}
              </h2>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Yopish"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className={cn('scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6', bodyClassName)}>{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 dark:border-slate-700/60 dark:bg-slate-900/30 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
