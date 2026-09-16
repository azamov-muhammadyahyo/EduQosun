import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import type { AccentColor } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { ProgressBar } from './ProgressBar'

export interface MetricTrend {
  text: string
  direction: 'up' | 'down' | 'flat'
  /** Pasayish yaxshi bo'lgan ko'rsatkichlar uchun (masalan, qarzdorlar) */
  inverted?: boolean
}

interface MetricCardProps {
  label: string
  value: ReactNode
  icon: LucideIcon
  color: AccentColor
  /** Pastki izoh */
  hint?: ReactNode
  trend?: MetricTrend
  /** 0–100 — progress chizig'i */
  progress?: number
  /** tinted — rangli fon (Darslarim), plain — oq karta (Guruhlarim) */
  variant?: 'tinted' | 'plain'
  onClick?: () => void
  className?: string
}

function TrendLabel({ trend }: { trend: MetricTrend }) {
  const good = trend.direction === 'flat' ? null : (trend.direction === 'up') !== !!trend.inverted
  const Icon = trend.direction === 'down' ? ArrowDownRight : ArrowUpRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold',
        good === null
          ? 'text-slate-500 dark:text-slate-400'
          : good
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400',
      )}
    >
      {trend.direction !== 'flat' ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {trend.text}
    </span>
  )
}

/** Statistika kartochkasi: ikonka + nom + katta qiymat + o'zgarish/izoh */
export function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  hint,
  trend,
  progress,
  variant = 'plain',
  onClick,
  className,
}: MetricCardProps) {
  const c = accent[color]
  const classes = cn(
    'group flex h-full w-full min-w-0 items-center gap-3.5 rounded-2xl border p-4 text-left shadow-card transition-all',
    variant === 'tinted' ? cn(c.softBorder, c.softBg) : 'border-slate-200/80 bg-white dark:border-slate-700/60 dark:bg-slate-800',
    onClick && 'hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
    className,
  )

  const content = (
    <>
      <span
        className={cn(
          'inline-flex h-12 w-12 shrink-0 items-center justify-center',
          variant === 'tinted' ? cn('rounded-full', c.strongBg) : cn('rounded-xl', c.iconBg),
          c.iconText,
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">{value}</span>
          {trend && progress === undefined ? <TrendLabel trend={trend} /> : null}
        </span>
        {progress !== undefined ? (
          <span className="mt-1.5 flex items-center gap-2">
            <ProgressBar value={progress} color={color} size="xs" className="flex-1" />
            {trend ? <TrendLabel trend={trend} /> : null}
          </span>
        ) : null}
        {hint ? <span className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
      </span>
    </>
  )

  return onClick ? (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  ) : (
    <div className={classes}>{content}</div>
  )
}
