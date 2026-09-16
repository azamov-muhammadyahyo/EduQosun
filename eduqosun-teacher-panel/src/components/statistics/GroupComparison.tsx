import { useState } from 'react'
import { ChartBarBig, Table2, UsersRound } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Group } from '../../types'
import { navigate } from '../../router'
import { rateTone } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { ChartTooltip, axisTick, useChartTheme } from '../charts/ChartKit'
import { Card } from '../ui/Card'
import { GroupTile } from '../ui/GroupIcon'
import { PanelHeader } from '../ui/PanelHeader'
import { ScoreBadge } from '../ui/StatusBadges'
import { SegmentedControl } from '../ui/Tabs'

export interface GroupStatRow {
  group: Group
  students: number
  attendance: number | null
  grade: number | null
  completion: number | null
  atRisk: number
}

type Metric = 'attendance' | 'grade' | 'completion'
type View = 'chart' | 'table'

const metricMeta: Record<Metric, { label: string; max: number; format: (v: number) => string }> = {
  attendance: { label: 'Davomat', max: 100, format: (v) => `${Math.round(v)}%` },
  grade: { label: "O'rtacha baho", max: 10, format: (v) => v.toFixed(1) },
  completion: { label: 'Topshiriqlar', max: 100, format: (v) => `${Math.round(v)}%` },
}

const rateText = {
  green: 'text-emerald-600 dark:text-emerald-400',
  blue: 'text-blue-600 dark:text-blue-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  slate: 'text-slate-400',
} as const

function Percent({ value }: { value: number | null }) {
  return <span className={cn('font-semibold tabular-nums', rateText[rateTone(value)])}>{value === null ? '—' : `${Math.round(value)}%`}</span>
}

/** Guruhlarni taqqoslash: gorizontal ustunli grafik yoki jadval */
export function GroupComparison({ rows }: { rows: GroupStatRow[] }) {
  const chart = useChartTheme()
  const [metric, setMetric] = useState<Metric>('attendance')
  const [view, setView] = useState<View>('chart')
  const meta = metricMeta[metric]

  const data = rows
    .map((row) => ({ name: row.group.name, value: row[metric] === null ? null : Math.round((row[metric] ?? 0) * 10) / 10 }))
    .filter((d): d is { name: string; value: number } => d.value !== null)
    .sort((a, b) => b.value - a.value)

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PanelHeader title="Guruhlar taqqoslash" icon={UsersRound} subtitle="Tanlangan davr bo'yicha" />
        <div className="flex flex-wrap items-center gap-2">
          {view === 'chart' ? (
            <SegmentedControl<Metric>
              size="sm"
              label="Ko'rsatkich"
              value={metric}
              onChange={setMetric}
              items={(Object.keys(metricMeta) as Metric[]).map((value) => ({ value, label: metricMeta[value].label }))}
            />
          ) : null}
          <SegmentedControl<View>
            size="sm"
            label="Ko'rinish"
            value={view}
            onChange={setView}
            items={[
              { value: 'chart', label: 'Grafik', icon: ChartBarBig },
              { value: 'table', label: 'Jadval', icon: Table2 },
            ]}
          />
        </div>
      </div>

      {view === 'chart' ? (
        <div className="mt-4 h-72">
          {data.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-slate-400">Ma'lumot yo'q</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid horizontal={false} stroke={chart.grid} strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, meta.max]} tick={axisTick(chart.axis)} axisLine={false} tickLine={false} tickFormatter={(v: number) => meta.format(v)} />
                <YAxis type="category" dataKey="name" tick={axisTick(chart.axis)} axisLine={false} tickLine={false} width={52} />
                <Tooltip cursor={{ fill: chart.cursor }} content={<ChartTooltip format={(v) => meta.format(v)} />} />
                <Bar dataKey="value" name={meta.label} fill="#2563EB" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
                  <LabelList dataKey="value" position="right" formatter={(v: number) => meta.format(v)} fill={chart.axis} fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-600 dark:bg-slate-700/30 dark:text-slate-300">
              <th scope="col" className="rounded-l-lg px-3 py-2.5 font-semibold">
                Guruh
              </th>
              <th scope="col" className="hidden px-3 py-2.5 text-center font-semibold sm:table-cell">
                O'quvchi
              </th>
              <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                Davomat
              </th>
              <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                Baho
              </th>
              <th scope="col" className="hidden px-3 py-2.5 text-center font-semibold md:table-cell">
                Topshiriqlar
              </th>
              <th scope="col" className="rounded-r-lg px-3 py-2.5 text-center font-semibold">
                Xavf
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {rows.map((row) => (
              <tr
                key={row.group.id}
                onClick={() => navigate(`groups/${row.group.id}`)}
                className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30"
              >
                <td className="px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <GroupTile icon={row.group.icon} color={row.group.color} size="sm" />
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-800 dark:text-slate-100">{row.group.name}</span>
                      <span className="block truncate text-xs text-slate-400">{row.group.course}</span>
                    </span>
                  </span>
                </td>
                <td className="hidden px-3 py-2.5 text-center tabular-nums text-slate-600 dark:text-slate-300 sm:table-cell">{row.students}</td>
                <td className="px-3 py-2.5 text-center">
                  <Percent value={row.attendance} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreBadge value={row.grade} />
                </td>
                <td className="hidden px-3 py-2.5 text-center md:table-cell">
                  <Percent value={row.completion} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn('font-semibold tabular-nums', row.atRisk > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400')}>{row.atRisk}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}
