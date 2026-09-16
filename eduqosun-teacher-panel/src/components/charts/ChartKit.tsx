import type { TooltipProps } from 'recharts'
import { useTheme } from '../../context/ThemeContext'

export interface ChartTheme {
  axis: string
  grid: string
  cursor: string
  track: string
}

/** Grafik o'qlari va to'r chiziqlari uchun mavzuga mos ranglar */
export function useChartTheme(): ChartTheme {
  const { theme } = useTheme()
  return theme === 'dark'
    ? { axis: '#94a3b8', grid: '#334155', cursor: 'rgba(148,163,184,0.08)', track: '#1e293b' }
    : { axis: '#64748b', grid: '#e2e8f0', cursor: 'rgba(148,163,184,0.14)', track: '#f1f5f9' }
}

export const axisTick = (color: string) => ({ fill: color, fontSize: 11 })

interface ChartTooltipProps extends TooltipProps<number, string> {
  /** Qiymat formatlash: 92 → "92%" */
  format?: (value: number, name: string) => string
}

/** Barcha grafiklar uchun yagona tooltip */
export function ChartTooltip({ active, payload, label, format }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lift dark:border-slate-700 dark:bg-slate-800">
      {label !== undefined ? <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{label}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <svg width="8" height="8" aria-hidden="true">
              <circle cx="4" cy="4" r="4" fill={entry.color} />
            </svg>
            <span>{entry.name}:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {typeof entry.value === 'number' ? (format ? format(entry.value, String(entry.name)) : entry.value) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Grafik izohi (legend) */
export function ChartLegend({ items }: { items: { label: string; dotClass: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`} aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </div>
  )
}
