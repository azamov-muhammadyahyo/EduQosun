import { ArrowUp } from 'lucide-react'
import type { Stat } from '../../types'
import { accent } from '../../lib/colors'

/**
 * Rangli fonli stat karta: katta ikonka (chapda) · raqam → nom → o'zgarish (o'ngda).
 * 1700px'dan tor ekranlarda ichki bo'shliq va ikonka kichrayadi — nomlar bir qatorda qolishi uchun.
 */
function LessonStatCard({ stat }: { stat: Stat }) {
  const c = accent[stat.color]
  const Icon = stat.icon
  return (
    <div
      className={`flex h-full items-start gap-3 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md min-[1700px]:gap-4 min-[1700px]:p-5 ${c.softBorder} ${c.softBg}`}
    >
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl min-[1700px]:h-12 min-[1700px]:w-12 ${c.strongBg} ${c.iconText}`}
      >
        <Icon className="h-5 w-5 min-[1700px]:h-6 min-[1700px]:w-6" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">
          {stat.value}
        </p>
        <p className="mt-2 text-[13px] font-medium leading-tight text-slate-600 dark:text-slate-300 min-[1700px]:text-sm">
          {stat.label}
        </p>
        {stat.changeTone === 'up' ? (
          <p className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {stat.change}
          </p>
        ) : (
          <p className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400">{stat.change}</p>
        )}
      </div>
    </div>
  )
}

/** Darslarim sahifasi statistikasi — 4 ta rangli karta (tor ekranda 2x2) */
export function LessonStats({ items }: { items: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 min-[1440px]:grid-cols-4 min-[1700px]:gap-4">
      {items.map((stat) => (
        <LessonStatCard key={stat.id} stat={stat} />
      ))}
    </div>
  )
}
