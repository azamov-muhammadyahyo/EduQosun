import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface PanelHeaderProps {
  title: string
  icon: LucideIcon
  subtitle?: ReactNode
  /** Sarlavha o'ngidagi element (masalan, "4 dars" yoki davr tanlash) */
  action?: ReactNode
  className?: string
}

/** Ko'k chiziqli ikonka + sarlavha (Darslarim/Guruhlarim uslubi) */
export function PanelHeader({ title, icon: Icon, subtitle, action, className }: PanelHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 h-6 w-6 shrink-0 text-blue-600 dark:text-blue-400" strokeWidth={1.8} aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
