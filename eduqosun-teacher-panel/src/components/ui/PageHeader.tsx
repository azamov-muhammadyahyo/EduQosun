import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface PageHeaderProps {
  title: string
  description?: string
  /** Katta ko'k ikonka qutisi (Darslarim uslubi) */
  icon?: LucideIcon
  actions?: ReactNode
  className?: string
}

/** Sahifa sarlavhasi: nom + tavsif (chapda) · amallar (o'ngda) */
export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex min-w-0 items-center gap-4">
        {Icon ? (
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/25">
            <Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="print-hidden flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div> : null}
    </div>
  )
}
