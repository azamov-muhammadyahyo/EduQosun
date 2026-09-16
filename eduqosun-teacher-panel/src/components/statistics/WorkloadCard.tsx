import { useMemo } from 'react'
import { Briefcase } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Group } from '../../types'
import { WEEKDAYS_SHORT, formatDuration, toMinutes } from '../../lib/date'
import { round1 } from '../../lib/format'
import { ChartTooltip, axisTick, useChartTheme } from '../charts/ChartKit'
import { Card } from '../ui/Card'
import { PanelHeader } from '../ui/PanelHeader'

/** Haftalik o'quv yuklamasi: faol guruhlar jadvali asosida kunlar bo'yicha soatlar */
export function WorkloadCard({ groups }: { groups: Group[] }) {
  const chart = useChartTheme()

  const { data, totalMinutes, lessons, busiest } = useMemo(() => {
    const perDay = WEEKDAYS_SHORT.map((label) => ({ label, minutes: 0, lessons: 0 }))
    for (const group of groups) {
      if (group.status !== 'active') continue
      for (const slot of group.schedule) {
        const day = perDay[slot.day - 1]
        day.minutes += Math.max(0, toMinutes(slot.end) - toMinutes(slot.start))
        day.lessons += 1
      }
    }
    const total = perDay.reduce((sum, d) => sum + d.minutes, 0)
    const top = perDay.reduce((best, d) => (d.minutes > best.minutes ? d : best), perDay[0])
    return {
      data: perDay.map((d) => ({ label: d.label, hours: round1(d.minutes / 60) })),
      totalMinutes: total,
      lessons: perDay.reduce((sum, d) => sum + d.lessons, 0),
      busiest: top.minutes > 0 ? top.label : null,
    }
  }, [groups])

  return (
    <Card className="p-5">
      <PanelHeader title="Haftalik yuklama" icon={Briefcase} subtitle="Faol guruhlar jadvali bo'yicha" />
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Jami vaqt', value: formatDuration(totalMinutes) },
          { label: 'Darslar', value: `${lessons} ta` },
          { label: 'Eng band kun', value: busiest ?? '—' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-slate-50 px-2 py-2.5 dark:bg-slate-900/40">
            <dt className="text-[11px] text-slate-500 dark:text-slate-400">{item.label}</dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{item.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={chart.grid} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={axisTick(chart.axis)} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={axisTick(chart.axis)} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: chart.cursor }} content={<ChartTooltip format={(v) => `${v} soat`} />} />
            <Bar dataKey="hours" name="Dars vaqti" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
