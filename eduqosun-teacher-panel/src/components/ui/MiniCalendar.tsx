import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AccentColor, DateKey } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { WEEKDAYS_SHORT, addMonths, dayOfMonth, formatDate, formatMonthYear, monthGrid } from '../../lib/date'

interface MiniCalendarProps {
  /** Ko'rsatilayotgan oy (istalgan kun) */
  month: DateKey
  onMonthChange: (month: DateKey) => void
  selected: DateKey | null
  onSelect: (date: DateKey) => void
  today: DateKey
  /** Kun ostidagi rangli nuqtalar (masalan, darslar) */
  markers?: Record<DateKey, AccentColor[]>
  /** Tanlab bo'lmaydigan kunlar */
  isDisabled?: (date: DateKey) => boolean
  className?: string
  /** Sarlavhani yashirish (tashqarida chizilganda) */
  hideHeader?: boolean
  compact?: boolean
}

/** Oylik taqvim: hafta Dushanbadan, bugun va tanlangan kun ajratiladi */
export function MiniCalendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  today,
  markers,
  isDisabled,
  className,
  hideHeader = false,
  compact = false,
}: MiniCalendarProps) {
  const cells = monthGrid(month)
  return (
    <div className={className}>
      {hideHeader ? null : (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatMonthYear(month)}</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMonthChange(addMonths(month, -1))}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
              aria-label="Oldingi oy"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onMonthChange(addMonths(month, 1))}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
              aria-label="Keyingi oy"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS_SHORT.map((day) => (
          <span key={day} className="pb-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
            {day}
          </span>
        ))}
      </div>

      <div className={cn('grid grid-cols-7 text-center', compact ? 'gap-y-0.5' : 'gap-y-1')}>
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} aria-hidden="true" />
          const isSelected = date === selected
          const isToday = date === today
          const disabled = isDisabled?.(date) ?? false
          const dots = markers?.[date] ?? []
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              aria-label={`${formatDate(date)}${dots.length ? `, ${dots.length} ta dars` : ''}`}
              className={cn(
                'relative mx-auto flex flex-col items-center justify-center rounded-lg text-sm tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-30',
                compact ? 'h-8 w-8' : 'h-9 w-9',
                isSelected
                  ? 'bg-blue-600 font-semibold text-white shadow-sm shadow-blue-600/30'
                  : isToday
                    ? 'font-semibold text-blue-600 ring-1 ring-inset ring-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:ring-blue-500/40 dark:hover:bg-blue-500/10'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
              )}
            >
              {dayOfMonth(date)}
              {dots.length > 0 ? (
                <span className="absolute bottom-0.5 flex gap-0.5" aria-hidden="true">
                  {dots.slice(0, 3).map((color, i) => (
                    <span key={i} className={cn('h-1 w-1 rounded-full', isSelected ? 'bg-white' : accent[color].solidBg)} />
                  ))}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
