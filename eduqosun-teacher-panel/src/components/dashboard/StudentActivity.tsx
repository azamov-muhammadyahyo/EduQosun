import { BarChart3 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { activityMiniStats, studentActivityData } from '../../data/studentActivity'
import { useTheme } from '../../context/ThemeContext'
import { SectionCard } from '../ui/SectionCard'

const ATTENDANCE_COLOR = '#2563EB'
const TASKS_COLOR = '#10B981'

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((entry) => (
          <li
            key={String(entry.dataKey)}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                entry.dataKey === 'attendance' ? 'bg-blue-600' : 'bg-emerald-500'
              }`}
            />
            <span>{entry.name}:</span>
            <span className="font-semibold">{entry.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** O'quvchilar faoliyati grafigi + mini statistika (§7.9) */
export function StudentActivity() {
  const { theme } = useTheme()
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b'
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0'
  const cursorColor = theme === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.14)'

  return (
    <SectionCard
      title="O'quvchilar faoliyati"
      icon={BarChart3}
      action={
        <select
          aria-label="Davr tanlash"
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option>So'nggi 7 kun</option>
          <option>So'nggi 30 kun</option>
        </select>
      }
    >
      {/* Legenda */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true" /> Dars qatnashuvi
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" /> Topshiriqlar
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={studentActivityData}
            margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
            barGap={4}
            barCategoryGap="22%"
          >
            <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: cursorColor }} content={<ChartTooltip />} />
            <Bar
              dataKey="attendance"
              name="Dars qatnashuvi"
              fill={ATTENDANCE_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
            />
            <Bar
              dataKey="tasks"
              name="Topshiriqlar"
              fill={TASKS_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mini statistika (§7.9) */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {activityMiniStats.map((mini) => (
          <div
            key={mini.id}
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700/60 dark:bg-slate-700/20"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{mini.label}</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{mini.value}</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {mini.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
