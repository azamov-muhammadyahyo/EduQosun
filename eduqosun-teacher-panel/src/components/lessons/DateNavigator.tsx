import { useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DateKey } from '../../types'
import {
  addDays,
  addMonths,
  formatDate,
  formatMonthYear,
  formatWeekRange,
  weekdayName,
} from '../../lib/date'
import { useLessonMarkers } from '../../hooks/useData'
import { useClock } from '../../store/clock'
import { Card } from '../ui/Card'
import { MiniCalendar } from '../ui/MiniCalendar'
import { Popover } from '../ui/Popover'

export type LessonsView = 'day' | 'week' | 'month' | 'list'

interface DateNavigatorProps {
  date: DateKey
  view: LessonsView
  onChange: (date: DateKey) => void
}

function step(date: DateKey, view: LessonsView, direction: 1 | -1): DateKey {
  if (view === 'week') return addDays(date, 7 * direction)
  if (view === 'month') return addMonths(date, direction)
  return addDays(date, direction)
}

/** Sana kartochkasi: ‹ 12-may 2025 › — bosilganda taqvim ochiladi */
export function DateNavigator({ date, view, onChange }: DateNavigatorProps) {
  const { today } = useClock()
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(date)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const markers = useLessonMarkers(month)

  const title = view === 'week' ? formatWeekRange(date) : view === 'month' ? formatMonthYear(date) : formatDate(date)
  const subtitle =
    view === 'week' ? 'Haftalik jadval' : view === 'month' ? 'Oylik jadval' : date === today ? `Bugun, ${weekdayName(date)}` : weekdayName(date)

  const navButton =
    'rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white'

  return (
    <Card className="flex items-center gap-2 px-3 py-2.5">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => {
          setMonth(date)
          setOpen((value) => !value)
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-w-0 items-center gap-3 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
      >
        <CalendarDays className="h-7 w-7 shrink-0 text-blue-600 dark:text-blue-400" strokeWidth={1.8} aria-hidden="true" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>
        </span>
      </button>
      <div className="ml-auto flex items-center">
        <button type="button" className={navButton} onClick={() => onChange(step(date, view, -1))} aria-label="Oldingi">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" className={navButton} onClick={() => onChange(step(date, view, 1))} aria-label="Keyingi">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} placement="bottom-start" label="Sana tanlash" className="w-72 p-4">
        <MiniCalendar
          month={month}
          onMonthChange={setMonth}
          selected={date}
          today={today}
          markers={markers}
          onSelect={(value) => {
            onChange(value)
            setOpen(false)
          }}
        />
        {date !== today ? (
          <button
            type="button"
            onClick={() => {
              onChange(today)
              setOpen(false)
            }}
            className="mt-3 w-full rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
          >
            Bugunga o'tish
          </button>
        ) : null}
      </Popover>
    </Card>
  )
}
