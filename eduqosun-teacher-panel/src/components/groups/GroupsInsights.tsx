import { useMemo, type ReactNode } from 'react'
import { ArrowUpRight, ChartColumn, ChartPie, Trophy, type LucideIcon } from 'lucide-react'
import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MONTHS_SHORT, addMonths, endOfMonth, parseDateKey } from '../../lib/date'
import { formatSigned, percent } from '../../lib/format'
import { fullName, rosterBreakdown } from '../../domain/students'
import { useStudentMetrics } from '../../hooks/useData'
import { navigateTo } from '../../router'
import { useApp } from '../../store/appStore'
import { useClock } from '../../store/clock'
import { openDrawer } from '../../store/uiStore'
import { ChartTooltip, axisTick, useChartTheme } from '../charts/ChartKit'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'
import { Donut } from '../ui/Donut'

function CardTitle({ icon: Icon, title, aside }: { icon: LucideIcon; title: string; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        {title}
      </h3>
      {aside}
    </div>
  )
}

/** Guruhlarim sahifasi pastidagi uchta tahliliy kartochka */
export function GroupsInsights() {
  const students = useApp((s) => s.students)
  const metrics = useStudentMetrics()
  const { today } = useClock()
  const chart = useChartTheme()
  const breakdown = useMemo(() => rosterBreakdown(students), [students])

  // Oxirgi 6 oy: har oy oxiridagi o'quvchilar soni (qo'shilganlar − chiqqanlar)
  const growth = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const monthStart = addMonths(today, index - 5)
      const monthEnd = index === 5 ? today : endOfMonth(monthStart)
      const count = students.filter((s) => s.joinedAt <= monthEnd && (!s.leftAt || s.leftAt > monthEnd)).length
      return { month: MONTHS_SHORT[parseDateKey(monthStart).getMonth()], count }
    })
  }, [students, today])
  const last = growth[growth.length - 1]?.count ?? 0
  const previous = growth[growth.length - 2]?.count ?? 0
  const growthPercent = previous > 0 ? Math.round(((last - previous) / previous) * 100) : 0

  const top = useMemo(
    () =>
      students
        .filter((s) => s.status === 'active')
        .map((s) => ({ student: s, score: metrics.get(s.id)?.score ?? 0 }))
        .sort((a, b) => b.score - a.score),
    [students, metrics],
  )
  const leaders = top.slice(0, 6)

  const legend = [
    { label: "O'qiyotgan", value: breakdown.active, dot: 'bg-blue-500', stroke: 'stroke-blue-500' },
    { label: 'Chiqqan', value: breakdown.left, dot: 'bg-rose-500', stroke: 'stroke-rose-500' },
    { label: "Guruhga o'tgan", value: breakdown.transferred, dot: 'bg-violet-500', stroke: 'stroke-violet-500' },
    { label: 'Bitirgan', value: breakdown.graduated, dot: 'bg-emerald-500', stroke: 'stroke-emerald-500' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      <Card className="p-4">
        <CardTitle icon={ChartPie} title="O'quvchilar statistikasi" />
        <div className="flex items-center gap-4">
          <Donut
            size={104}
            thickness={13}
            label="O'quvchilar tarkibi"
            segments={legend.map((item) => ({ id: item.label, value: item.value, strokeClass: item.stroke }))}
          >
            <span className="text-xl font-bold text-slate-900 dark:text-white">{breakdown.total}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">jami</span>
          </Donut>
          <ul className="min-w-0 flex-1 space-y-1.5">
            {legend.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                  {item.value} <span className="font-normal text-slate-400">({percent(item.value, breakdown.total)}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card className="p-4">
        <CardTitle
          icon={ChartColumn}
          title="Guruhlar bo'yicha o'sish"
          aside={
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${growthPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
            >
              <ArrowUpRight className={`h-3.5 w-3.5 ${growthPercent < 0 ? 'rotate-90' : ''}`} aria-hidden="true" />
              {formatSigned(growthPercent, '%')} <span className="font-normal text-slate-400">(oxirgi oy)</span>
            </span>
          }
        />
        <div className="h-[112px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={growth} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
              <XAxis dataKey="month" tick={axisTick(chart.axis)} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick(chart.axis)} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
              <Tooltip cursor={{ fill: chart.cursor }} content={<ChartTooltip format={(v) => `${v} ta`} />} />
              <Bar dataKey="count" name="O'quvchilar" fill="#93C5FD" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
              <Line dataKey="count" name="Tendensiya" stroke="#2563EB" strokeWidth={2} dot={{ r: 2.5 }} type="monotone" isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 md:col-span-2 2xl:col-span-1">
        <CardTitle
          icon={Trophy}
          title="Faol o'quvchilar"
          aside={
            <button
              type="button"
              onClick={() => navigateTo('students', null, { sort: 'score' })}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-blue-500/10"
            >
              Barchasi
            </button>
          }
        />
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {leaders.map(({ student }) => (
              <button
                key={student.id}
                type="button"
                onClick={() => openDrawer({ type: 'student', studentId: student.id })}
                title={fullName(student)}
                className="rounded-full transition-transform hover:z-10 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Avatar name={fullName(student)} color={student.color} size="md" variant="solid" ring />
              </button>
            ))}
          </div>
          {top.length > leaders.length ? (
            <span className="ml-2 inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-blue-50 px-2 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              +{top.length - leaders.length}
            </span>
          ) : null}
        </div>
        {leaders[0] ? (
          <p className="mt-3 truncate text-xs text-slate-500 dark:text-slate-400">
            Yetakchi: <span className="font-semibold text-slate-700 dark:text-slate-200">{fullName(leaders[0].student)}</span> · reyting{' '}
            {Math.round(leaders[0].score)}
          </p>
        ) : null}
      </Card>
    </div>
  )
}
