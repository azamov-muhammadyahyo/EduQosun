import { ArrowUp, type LucideIcon } from 'lucide-react'
import type { AccentColor } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'

export interface LessonStat {
  id: string
  label: string
  value: number | string
  icon: LucideIcon
  color: AccentColor
  hint: string
  /** up — yashil strelka; accent — karta rangidagi matn */
  hintTone?: 'up' | 'accent' | 'muted'
  onClick?: () => void
}

const hintColor: Partial<Record<AccentColor, string>> = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-emerald-600 dark:text-emerald-400',
  violet: 'text-violet-600 dark:text-violet-400',
  amber: 'text-amber-600 dark:text-amber-400',
  orange: 'text-orange-600 dark:text-orange-400',
}

/**
 * Rangli fonli stat karta: katta ikonka (chapda) · nom → raqam → izoh (o'ngda).
 * 1700px'dan tor ekranlarda ichki bo'shliq va ikonka kichrayadi — nomlar bir qatorda qolishi uchun.
 */
function LessonStatCard({ stat }: { stat: LessonStat }) {
  const c = accent[stat.color]
  const Icon = stat.icon
  const tone = stat.hintTone ?? 'accent'
  return (
    <button
      type="button"
      onClick={stat.onClick}
      disabled={!stat.onClick}
      className={cn(
        'flex h-full w-full items-start gap-3 rounded-2xl border p-4 text-left shadow-sm transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-md disabled:cursor-default min-[1700px]:gap-4 min-[1700px]:p-5',
        c.softBorder,
        c.softBg,
      )}
    >
      <span
        className={cn(
          'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full min-[1700px]:h-12 min-[1700px]:w-12',
          c.strongBg,
          c.iconText,
        )}
      >
        <Icon className="h-5 w-5 min-[1700px]:h-6 min-[1700px]:w-6" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="min-w-0 pt-0.5">
        <span className="block truncate text-[13px] font-medium text-slate-600 dark:text-slate-300 min-[1700px]:text-sm">{stat.label}</span>
        <span className="mt-1.5 block text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">{stat.value}</span>
        <span
          className={cn(
            'mt-2.5 flex items-center gap-1 truncate text-xs font-medium',
            tone === 'up' && 'text-emerald-600 dark:text-emerald-400',
            tone === 'accent' && (hintColor[stat.color] ?? 'text-blue-600 dark:text-blue-400'),
            tone === 'muted' && 'text-slate-500 dark:text-slate-400',
          )}
        >
          {tone === 'up' ? <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
          {stat.hint}
        </span>
      </span>
    </button>
  )
}

/** Darslarim sahifasi statistikasi — 4 ta rangli karta (tor ekranda 2x2) */
export function LessonStats({ items }: { items: LessonStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 min-[1440px]:grid-cols-4 min-[1700px]:gap-4">
      {items.map((stat) => (
        <LessonStatCard key={stat.id} stat={stat} />
      ))}
    </div>
  )
}
