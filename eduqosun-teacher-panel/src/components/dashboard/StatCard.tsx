import { TrendingUp } from 'lucide-react'
import type { Stat } from '../../types'
import { accent } from '../../lib/colors'
import { IconBox } from '../ui/IconBox'

/** Ixcham statistika kartochkasi: ikonka + sarlavha (yuqorida), katta raqam, o'zgarish (§7.4) */
export function StatCard({ stat }: { stat: Stat }) {
  const c = accent[stat.color]
  return (
    <div
      className={`flex h-full items-start gap-3 rounded-2xl border border-slate-200 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700/60 ${c.softBg}`}
    >
      <IconBox icon={stat.icon} color={stat.color} size="md" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-xs font-medium leading-tight text-slate-500 dark:text-slate-400">
          {stat.label}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {stat.value}
        </p>
        <div className="mt-auto pt-2 text-xs font-medium">
          {stat.changeTone === 'up' ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              {stat.change}
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">{stat.change}</span>
          )}
        </div>
      </div>
    </div>
  )
}
