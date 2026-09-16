import { useMemo } from 'react'
import { ChartColumn, MessageSquare, TrendingDown } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatGrade } from '../../domain/grades'
import { fullName } from '../../domain/students'
import { openDrawer, openModal } from '../../store/uiStore'
import { ChartTooltip, axisTick, useChartTheme } from '../charts/ChartKit'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { IconButton } from '../ui/IconButton'
import { PanelHeader } from '../ui/PanelHeader'
import type { GradebookRow } from './GradebookTable'

const buckets = [
  { label: '0–4.9', below: 5, color: '#F43F5E' },
  { label: '5–6.9', below: 7, color: '#F59E0B' },
  { label: '7–8.9', below: 9, color: '#3B82F6' },
  { label: '9–10', below: Infinity, color: '#10B981' },
]

const bucketOf = (value: number) => buckets.find((bucket) => value < bucket.below) ?? buckets[buckets.length - 1]

/** Jurnal ostidagi tahlil: o'rtacha baholar taqsimoti va yordam kerak bo'lgan o'quvchilar */
export function GradesInsights({ rows }: { rows: GradebookRow[] }) {
  const chart = useChartTheme()

  const distribution = useMemo(
    () =>
      buckets.map((bucket) => ({
        ...bucket,
        count: rows.filter((row) => row.average !== null && bucketOf(row.average) === bucket).length,
      })),
    [rows],
  )

  const struggling = useMemo(
    () =>
      rows
        .filter((row) => row.average !== null && row.average < 6)
        .sort((a, b) => (a.average ?? 0) - (b.average ?? 0))
        .slice(0, 5),
    [rows],
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <PanelHeader title="Baholar taqsimoti" icon={ChartColumn} subtitle="O'quvchilarning o'rtacha bahosi bo'yicha" />
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
              <XAxis dataKey="label" tick={axisTick(chart.axis)} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick(chart.axis)} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: chart.cursor }} content={<ChartTooltip format={(v) => `${v} ta o'quvchi`} />} />
              <Bar dataKey="count" name="O'quvchilar" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={false}>
                {distribution.map((item) => (
                  <Cell key={item.label} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <PanelHeader title="Yordam kerak" icon={TrendingDown} subtitle="O'rtacha bahosi 6 dan past" />
        {struggling.length === 0 ? (
          <EmptyState compact icon={ChartColumn} message="Ajoyib! Barcha o'quvchilarning o'rtacha bahosi yetarli." />
        ) : (
          <ul className="mt-3 space-y-1">
            {struggling.map(({ student, average }) => (
              <li key={student.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDrawer({ type: 'student', studentId: student.id })}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <Avatar name={fullName(student)} color={student.color} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{fullName(student)}</span>
                  <span className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold tabular-nums text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    {formatGrade(average)}
                  </span>
                </button>
                <IconButton
                  icon={MessageSquare}
                  label="Ota-onaga xabar"
                  onClick={() =>
                    openModal({
                      type: 'compose',
                      target: { kind: 'parent', id: student.id },
                      text: `Assalomu alaykum! ${fullName(student)}ning o'rtacha bahosi ${formatGrade(average)}. Uyda qo'shimcha takrorlash tavsiya qilaman.`,
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
