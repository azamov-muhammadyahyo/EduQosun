import { TrendingUp, type LucideIcon } from 'lucide-react'
import type { AccentColor } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { IconBox } from '../ui/IconBox'

export interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  color: AccentColor
  /** Pastki izoh ("+1 yangi") */
  change: string
  /** up — yashil strelka bilan, neutral — kulrang matn */
  tone?: 'up' | 'neutral'
  onClick?: () => void
}

/** Ixcham statistika kartochkasi: ikonka + sarlavha, katta raqam, o'zgarish */
export function StatCard({ label, value, icon, color, change, tone = 'neutral', onClick }: StatCardProps) {
  const c = accent[color]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-full w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700/60',
        c.softBg,
      )}
    >
      <IconBox icon={icon} color={color} size="md" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-medium leading-tight text-slate-500 dark:text-slate-400">{label}</span>
        <span className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</span>
        <span className="mt-auto pt-2 text-xs font-medium">
          {tone === 'up' ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              {change}
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">{change}</span>
          )}
        </span>
      </span>
    </button>
  )
}
