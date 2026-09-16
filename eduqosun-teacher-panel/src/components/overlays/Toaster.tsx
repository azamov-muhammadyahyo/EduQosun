import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import type { ToastItem, ToastTone } from '../../types'
import { cn } from '../../lib/cn'
import { dismissToast, useToasts } from '../../store/toastStore'

const toneConfig: Record<ToastTone, { icon: LucideIcon; iconClass: string; bar: string }> = {
  success: { icon: CircleCheck, iconClass: 'text-emerald-500', bar: 'bg-emerald-500' },
  error: { icon: CircleAlert, iconClass: 'text-rose-500', bar: 'bg-rose-500' },
  info: { icon: Info, iconClass: 'text-blue-500', bar: 'bg-blue-500' },
  warning: { icon: TriangleAlert, iconClass: 'text-amber-500', bar: 'bg-amber-500' },
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const [paused, setPaused] = useState(false)
  const remaining = useRef(toast.durationMs)
  const startedAt = useRef(Date.now())

  useEffect(() => {
    if (paused) return undefined
    startedAt.current = Date.now()
    const id = window.setTimeout(() => dismissToast(toast.id), remaining.current)
    return () => {
      window.clearTimeout(id)
      remaining.current -= Date.now() - startedAt.current
    }
  }, [paused, toast.id])

  const config = toneConfig[toast.tone]
  const Icon = config.icon
  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="pointer-events-auto relative flex w-full animate-toast-in items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-3 shadow-lift dark:border-slate-700 dark:bg-slate-800"
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', config.bar)} aria-hidden="true" />
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{toast.title}</p>
        {toast.description ? <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{toast.description}</p> : null}
      </div>
      {toast.actionLabel && toast.onAction ? (
        <button
          type="button"
          onClick={() => {
            toast.onAction?.()
            dismissToast(toast.id)
          }}
          className="shrink-0 rounded-md px-2 py-1 text-[13px] font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
        >
          {toast.actionLabel}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
        aria-label="Bildirishnomani yopish"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

/** Ekranning pastki o'ng burchagidagi bildirishnomalar */
export function Toaster() {
  const toasts = useToasts()
  return createPortal(
    <div
      className="print-hidden pointer-events-none fixed inset-x-3 bottom-3 z-[90] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px]"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  )
}
