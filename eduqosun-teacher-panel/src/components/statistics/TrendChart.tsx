import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '../../lib/cn'
import { ChartLegend, ChartTooltip, axisTick, useChartTheme } from '../charts/ChartKit'

export interface TrendSeries {
  key: string
  name: string
  /** Chiziq rangi (HEX) */
  color: string
  /** Legenda nuqtasi sinfi */
  dotClass: string
}

export type TrendPoint = { label: string } & Record<string, number | null | string>

interface TrendChartProps {
  data: TrendPoint[]
  series: TrendSeries[]
  domain: [number, number]
  format: (value: number) => string
  /** Balandlik sinfi, masalan "h-60" */
  heightClass?: string
  emptyText?: string
}

/** Vaqt bo'yicha chiziqli grafik: bitta o'q, 2px chiziqlar, tooltip va legenda */
export function TrendChart({ data, series, domain, format, heightClass = 'h-60', emptyText = "Bu davr uchun ma'lumot yo'q" }: TrendChartProps) {
  const chart = useChartTheme()
  const hasData = data.some((point) => series.some((s) => typeof point[s.key] === 'number'))

  return (
    <div>
      {series.length > 1 ? <ChartLegend items={series.map((s) => ({ label: s.name, dotClass: s.dotClass }))} /> : null}
      <div className={cn('mt-3 w-full', heightClass)}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={chart.grid} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={axisTick(chart.axis)} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
              <YAxis domain={domain} tick={axisTick(chart.axis)} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => format(v)} />
              <Tooltip cursor={{ stroke: chart.axis, strokeDasharray: '4 4' }} content={<ChartTooltip format={(v) => format(v)} />} />
              {series.map((s) => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2, fill: chart.track }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  type="monotone"
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-slate-400">{emptyText}</p>
        )}
      </div>
    </div>
  )
}
