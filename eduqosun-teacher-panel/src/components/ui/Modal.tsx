import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, type LucideIcon } from 'lucide-react'
import type { AccentColor } from '../../types'
import { cn } from '../../lib/cn'
import { useFocusTrap, useLockBodyScroll } from '../../hooks/useDom'
import { IconBox } from './IconBox'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: AccentColor
  size?: ModalSize
  children: ReactNode
  footer?: ReactNode
  /** Berilsa — tana <form> bo'lib o'raladi (Enter bilan yuborish) */
  onSubmit?: () => void
  bodyClassName?: string
  /** Fon ustiga bosilganda yopilmasin (uzun formalar uchun) */
  persistent?: boolean
}

const sizeMap: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

/** Markaziy dialog oynasi: fokus tuzog'i, Esc, fon bosilganda yopish, sahifa aylanishi bloklanadi */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  iconColor = 'blue',
  size = 'md',
  children,
  footer,
  onSubmit,
  bodyClassName,
  persistent = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  useLockBodyScroll(open)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    const panel = panelRef.current
    panel?.addEventListener('keydown', onKeyDown)
    return () => panel?.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit?.()
  }

  const body = (
    <>
      <div className={cn('scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>{children}</div>
      {footer ? (
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-700/60 dark:bg-slate-900/30 sm:flex-row sm:items-center sm:justify-end">
          {footer}
        </div>
      ) : null}
    </>
  )

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-overlay-in bg-slate-900/50 backdrop-blur-[2px]"
        onClick={persistent ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-pop-in flex-col overflow-hidden rounded-t-2xl bg-white shadow-overlay outline-none dark:bg-slate-800 sm:rounded-2xl',
          sizeMap[size],
        )}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-700/60">
          {icon ? <IconBox icon={icon} color={iconColor} size="sm" /> : null}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Yopish"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {onSubmit ? (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
            {body}
          </form>
        ) : (
          body
        )}
      </div>
    </div>,
    document.body,
  )
}
