import { BarChart3 } from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'
import { lessonDonutStats, lessonTotalCount } from '../../data/lessonsList'
import type { AccentColor } from '../../types'
import { accent } from '../../lib/colors'
import { Card } from '../ui/Card'
import { PanelHeader } from '../ui/PanelHeader'

/**
 * Donut qat'iy o'lchamda chiziladi (quti sinfi: h-[136px] w-[136px]).
 * ResponsiveContainer breakpoint almashganda o'lchamni yangilamay, markazdagi yozuv siljib qolardi.
 */
const DONUT_SIZE = 136

/** Dizaynda "Tugallandi" ulushi ochiq kulrang — boshqa ranglar umumiy palitradan olinadi */
const LIGHT_SLATE_HEX = '#CBD5E1'

function chartFill(color: AccentColor): string {
  return color === 'slate' ? LIGHT_SLATE_HEX : accent[color].hex
}

function legendDot(color: AccentColor): string {
  return color === 'slate' ? 'bg-slate-300 dark:bg-slate-500' : accent[color].solidBg
}

/** "Darslar bo'yicha statistika" — donut (chapda) + izoh (o'ngda); tor o'ng ustunda izoh pastga tushadi */
export function LessonsDonut() {
  return (
    <Card className="p-5">
      <PanelHeader
        title="Darslar bo'yicha statistika"
        icon={BarChart3}
        action={
          <select
            aria-label="Davr tanlash"
            className="cursor-pointer rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-1.5 text-xs font-medium text-slate-600 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option>7 kun</option>
            <option>30 kun</option>
          </select>
        }
      />

      <div className="mt-5 flex items-center gap-5 xl:flex-col xl:gap-4 2xl:flex-row 2xl:gap-6">
        <div className="relative h-[136px] w-[136px] shrink-0">
          <PieChart width={DONUT_SIZE} height={DONUT_SIZE} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={lessonDonutStats}
              dataKey="value"
              nameKey="label"
              innerRadius={DONUT_SIZE * 0.35}
              outerRadius={DONUT_SIZE * 0.5}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              /* Animatsiya ba'zi muhitlarda (StrictMode, headless) boshlang'ich holatda qotib, halqa chizilmay qoladi */
              isAnimationActive={false}
            >
              {lessonDonutStats.map((item) => (
                <Cell key={item.id} fill={chartFill(item.color)} />
              ))}
            </Pie>
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none text-slate-900 dark:text-white">
              {lessonTotalCount}
            </span>
            <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Jami darslar</span>
          </div>
        </div>

        <ul className="w-full min-w-0 flex-1 space-y-3.5">
          {lessonDonutStats.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${legendDot(item.color)}`} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-100">
                {item.value} <span className="font-normal text-slate-400">({item.percent}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
