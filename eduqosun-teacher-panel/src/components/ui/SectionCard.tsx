import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Card } from './Card'

interface SectionCardProps {
  title: string
  icon?: LucideIcon
  description?: string
  /** Sarlavha o'ngidagi element (masalan, "Barchasi" havolasi yoki strelkalar) */
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Sarlavha ostidagi chiziq */
  divided?: boolean
}

/** Sarlavhali kartochka — bosh sahifadagi ko'p bo'limlar shu asosda quriladi */
export function SectionCard({
  title,
  icon: Icon,
  description,
  action,
  children,
  className,
  bodyClassName = 'p-5',
  divided = true,
}: SectionCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-5 py-4',
          divided && 'border-b border-slate-100 dark:border-slate-700/60',
        )}
      >
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            {Icon ? <Icon className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" /> : null}
            <span className="truncate">{title}</span>
          </h2>
          {description ? <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-1">{action}</div> : null}
      </div>
      <div className={cn('min-h-0 flex-1', bodyClassName)}>{children}</div>
    </Card>
  )
}
