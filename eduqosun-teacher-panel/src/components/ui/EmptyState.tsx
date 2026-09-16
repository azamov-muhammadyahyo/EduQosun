import type { ReactNode } from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface EmptyStateProps {
  title?: string
  message: string
  icon?: LucideIcon
  action?: ReactNode
  compact?: boolean
  className?: string
}

/** Bo'sh holat: "Ma'lumot yo'q" o'rniga foydali matn va keyingi qadam */
export function EmptyState({ title, message, icon: Icon = Inbox, action, compact = false, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-1.5 py-6' : 'gap-2 py-10',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-700/50 dark:text-slate-500',
          compact ? 'h-10 w-10' : 'h-14 w-14',
        )}
      >
        <Icon className={compact ? 'h-5 w-5' : 'h-7 w-7'} aria-hidden="true" />
      </span>
      {title ? <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p> : null}
      <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
