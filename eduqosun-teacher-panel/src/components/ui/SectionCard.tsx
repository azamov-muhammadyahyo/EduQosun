import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from './Card'

interface SectionCardProps {
  title: string
  icon?: LucideIcon
  /** Sarlavha o'ngidagi element (masalan, "Barchasi" havolasi yoki strelkalar) */
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

/** Sarlavhali kartochka — dashboard'dagi ko'p bo'limlar shu asosda quriladi (§7) */
export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  className = '',
  bodyClassName = 'p-5',
}: SectionCardProps) {
  return (
    <Card className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700/60">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
          {Icon ? <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" aria-hidden="true" /> : null}
          <span>{title}</span>
        </h2>
        {action ? <div className="flex shrink-0 items-center gap-1">{action}</div> : null}
      </div>
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </Card>
  )
}
