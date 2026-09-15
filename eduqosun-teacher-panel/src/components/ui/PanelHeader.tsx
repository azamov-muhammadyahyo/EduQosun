import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconBox } from './IconBox'

interface PanelHeaderProps {
  title: string
  icon: LucideIcon
  /** Sarlavha o'ngidagi element (masalan, "4 ta dars" yoki davr tanlash) */
  action?: ReactNode
  className?: string
}

/** Ko'k fonli ikonka qutichasi bilan kartochka sarlavhasi (Darslarim sahifasi uslubi) */
export function PanelHeader({ title, icon, action, className = '' }: PanelHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <h2 className="flex min-w-0 items-center gap-3 text-[15px] font-semibold leading-snug text-slate-900 dark:text-slate-100">
        <IconBox icon={icon} color="blue" size="sm" />
        <span>{title}</span>
      </h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
