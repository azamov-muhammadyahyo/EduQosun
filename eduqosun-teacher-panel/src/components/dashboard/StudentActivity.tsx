import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DateKey } from '../../types'
import { cn } from '../../lib/cn'
import { addDays, formatDayMonth } from '../../lib/date'
import { attendanceRate, emptySummary, homeworkRate, mergeSummary } from '../../domain/attendance'
import { attendanceByRanges, type AttendanceBucket } from '../../domain/analytics'
import { navigateTo } from '../../router'
import { useApp } from '../../store/appStore'
import { useClock } from '../../store/clock'
import { ChartLegend, ChartTooltip, axisTick, useChartTheme } from '../charts/ChartKit'
import { Select } from '../ui/Form'
import { SectionCard } from '../ui/SectionCard'

type Period = '7' | '30'

const ATTENDANCE_COLOR = '#2563EB'
const TASKS_COLOR = '#10B981'

interface Range {
  label: string
  from: DateKey
  to: DateKey
}

/** 7 kun — har kun alohida; 30 kun — 5 kunlik bo'laklar */
function buildRanges(period: Period, end: DateKey): Range[] {
  if (period === '7') {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(end, i - 6)
      return { label: formatDayMonth(day).replace('-', ' '), from: day, to: day }
    })
  }
  return Array.from({ length: 6 }, (_, i) => {
    const from = addDays(end, (i - 6) * 5 + 1)
    const to = addDays(from, 4)
    return { label: formatDayMonth(to).replace('-', ' '), from, to }
  })
}

function totals(buckets: AttendanceBucket[]) {
  const summary = emptySummary()
  for (const bucket of buckets) mergeSummary(summary, bucket.summary)
  return { attendance: attendanceRate(summary), homework: homeworkRate(summary) }
}

function Delta({ value, suffix = '%' }: { value: number | null; suffix?: string }) {
  if (value === null || value === 0) return <span className="text-xs font-medium text-slate-400">—</span>
  const up = value > 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn('inline-flex items-center text-xs font-semibold', up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {Math.abs(value)}
      {suffix}
    </span>
  )
}

/** O'quvchilar faoliyati: davomat va uy vazifasi bajarilishi dinamikasi */
export function StudentActivity() {
  const attendance = useApp((s) => s.attendance)
  const extras = useApp((s) => s.extraLessons)
  const students = useApp((s) => s.students)
  const { today } = useClock()
  const chart = useChartTheme()
  const [period, setPeriod] = useState<Period>('7')

  const { data, current, delta, activeCount, newCount } = useMemo(() => {
    const days = Number(period)
    const ranges = buildRanges(period, today)
    const buckets = attendanceByRanges(ranges, attendance, extras)
    const previous = attendanceByRanges(
      [{ label: '', from: addDays(today, -2 * days + 1), to: addDays(today, -days) }],
      attendance,
      extras,
    )
    const now = totals(buckets)
    const before = totals(previous)
    const diff = (a: number | null, b: number | null) => (a === null || b === null ? null : Math.round(a - b))
    const periodStart = addDays(today, -days + 1)
    return {
      data: buckets
        .filter((b) => b.rate !== null)
        .map((b) => ({
          label: b.label,
          attendance: Math.round(b.rate ?? 0),
          tasks: b.homeworkRate === null ? null : Math.round(b.homeworkRate),
        })),
      current: now,
      delta: { attendance: diff(now.attendance, before.attendance), homework: diff(now.homework, before.homework) },
      activeCount: students.filter((s) => s.status === 'active').length,
      newCount: students.filter((s) => s.status === 'active' && s.joinedAt >= periodStart).length,
    }
  }, [period, today, attendance, extras, students])

  const tiles = [
    { label: "O'rtacha qatnashuv", value: current.attendance, delta: <Delta value={delta.attendance} />, page: 'attendance' as const },
    { label: 'Topshiriq topshirganlar', value: current.homework, delta: <Delta value={delta.homework} />, page: 'tasks' as const },
  ]

  return (
    <SectionCard
      title="O'quvchilar faoliyati"
      icon={BarChart3}
      className="h-full"
      action={
        <Select<Period>
          size="sm"
          value={period}
          onChange={setPeriod}
          aria-label="Davr tanlash"
          options={[
            { value: '7', label: "So'nggi 7 kun" },
            { value: '30', label: "So'nggi 30 kun" },
          ]}
        />
      }
    >
      <ChartLegend
        items={[
          { label: 'Dars qatnashuvi', dotClass: 'bg-blue-600' },
          { label: 'Topshiriqlar', dotClass: 'bg-emerald-500' },
        ]}
      />

      <div className="mt-3 h-52 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barGap={4} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke={chart.grid} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={axisTick(chart.axis)} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={axisTick(chart.axis)} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: chart.cursor }} content={<ChartTooltip format={(v) => `${v}%`} />} />
              <Bar dataKey="attendance" name="Dars qatnashuvi" fill={ATTENDANCE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
              <Bar dataKey="tasks" name="Topshiriqlar" fill={TASKS_COLOR} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-slate-400">Bu davrda davomat olinmagan</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <button
            key={tile.label}
            type="button"
            onClick={() => navigateTo(tile.page)}
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-left transition-colors hover:border-slate-200 hover:bg-slate-100/70 dark:border-slate-700/60 dark:bg-slate-700/20 dark:hover:bg-slate-700/40"
          >
            <span className="block text-xs leading-tight text-slate-500 dark:text-slate-400">{tile.label}</span>
            <span className="mt-1 flex items-baseline justify-between gap-1.5">
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {tile.value === null ? '—' : `${Math.round(tile.value)}%`}
              </span>
              {tile.delta}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => navigateTo('students')}
          className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-left transition-colors hover:border-slate-200 hover:bg-slate-100/70 dark:border-slate-700/60 dark:bg-slate-700/20 dark:hover:bg-slate-700/40"
        >
          <span className="block text-xs leading-tight text-slate-500 dark:text-slate-400">Faol o'quvchilar</span>
          <span className="mt-1 flex items-baseline justify-between gap-1.5">
            <span className="text-lg font-bold text-slate-900 dark:text-white">{activeCount}</span>
            <Delta value={newCount} suffix="" />
          </span>
        </button>
      </div>
    </SectionCard>
  )
}
