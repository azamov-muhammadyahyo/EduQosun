import { BarChart3 } from 'lucide-react'
import { percent } from '../../lib/format'
import { Card } from '../ui/Card'
import { Donut } from '../ui/Donut'
import { PanelHeader } from '../ui/PanelHeader'

export interface WeeklyPlan {
  held: number
  remaining: number
  canceled: number
}

/** "Haftalik reja" — o'tkazilgan / qolgan / bekor qilingan darslar ulushi */
export function LessonsDonut({ plan, label }: { plan: WeeklyPlan; label: string }) {
  const total = plan.held + plan.remaining + plan.canceled
  const items = [
    { id: 'held', label: "O'tkazildi", value: plan.held, dot: 'bg-emerald-500', stroke: 'stroke-emerald-500' },
    { id: 'remaining', label: 'Qolgan', value: plan.remaining, dot: 'bg-blue-600', stroke: 'stroke-blue-600' },
    { id: 'canceled', label: 'Bekor qilingan', value: plan.canceled, dot: 'bg-slate-300 dark:bg-slate-500', stroke: 'stroke-slate-300 dark:stroke-slate-500' },
  ]

  return (
    <Card className="p-5">
      <PanelHeader
        title="Haftalik reja"
        icon={BarChart3}
        action={<span className="text-xs font-medium text-blue-600 dark:text-blue-400">{label}</span>}
      />
      <div className="mt-5 flex items-center gap-5 xl:flex-col xl:gap-4 2xl:flex-row 2xl:gap-6">
        <Donut
          size={136}
          thickness={14}
          label="Haftalik reja"
          segments={items.map((item) => ({ id: item.id, value: item.value, strokeClass: item.stroke }))}
        >
          <span className="text-3xl font-bold leading-none text-slate-900 dark:text-white">{total}</span>
          <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Jami darslar</span>
        </Donut>
        <ul className="w-full min-w-0 flex-1 space-y-3.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-[13px]">
              <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                {item.value} <span className="font-normal text-slate-400">({percent(item.value, total)}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
