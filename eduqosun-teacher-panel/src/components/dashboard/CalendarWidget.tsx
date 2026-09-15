import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { calendarInfo } from '../../data/teacher'
import { Card } from '../ui/Card'

/** May 2025 uchun katakchalar ro'yxatini quradi (hafta Dushanbadan boshlanadi) */
function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay() // 0 = Yakshanba
  const leadingBlanks = (firstWeekday + 6) % 7 // Dushanbadan boshlanishga moslash
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** Kun taqvimi (§7.7) */
export function CalendarWidget() {
  const { year, month, monthLabel, activeDay, weekdays, summaryTitle, summarySubtitle } = calendarInfo
  const cells = buildCalendarCells(year, month)

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="whitespace-nowrap text-base font-semibold text-slate-900 dark:text-slate-100">
          Kun taqvimi
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            aria-label="Oldingi oy"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="whitespace-nowrap text-center text-xs font-medium text-slate-600 dark:text-slate-300">
            {monthLabel}
          </span>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            aria-label="Keyingi oy"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {weekdays.map((weekday) => (
          <span key={weekday} className="py-1 text-xs font-medium text-slate-400 dark:text-slate-500">
            {weekday}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 text-center">
        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`blank-${index}`} aria-hidden="true" />
          }
          const isActive = day === activeDay
          return (
            <button
              key={day}
              type="button"
              aria-current={isActive ? 'date' : undefined}
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 font-semibold text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50/70 p-3 dark:bg-blue-500/10">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{summaryTitle}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{summarySubtitle}</p>
        </div>
      </div>
    </Card>
  )
}
