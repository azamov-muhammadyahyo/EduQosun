import type { DateKey, Group, Lesson } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { dayOfMonth, formatDate, monthGrid, WEEKDAYS_SHORT } from '../../lib/date'
import { useClock } from '../../store/clock'

interface MonthViewProps {
  date: DateKey
  lessons: Lesson[]
  groupMap: Map<string, Group>
  onOpenDay: (date: DateKey) => void
}

const MAX_CHIPS = 3

/** Oylik taqvim: har kunda darslar qisqacha ko'rinadi, bosilsa — o'sha kun ochiladi */
export function MonthView({ date, lessons, groupMap, onOpenDay }: MonthViewProps) {
  const { today } = useClock()
  const cells = monthGrid(date)

  const byDate = new Map<DateKey, Lesson[]>()
  for (const lesson of lessons) {
    if (lesson.canceled) continue
    const list = byDate.get(lesson.date)
    if (list) list.push(lesson)
    else byDate.set(lesson.date, [lesson])
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 pb-2 text-center">
        {WEEKDAYS_SHORT.map((day) => (
          <span key={day} className="text-xs font-semibold text-slate-400">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, index) => {
          if (!day) return <span key={`blank-${index}`} aria-hidden="true" />
          const dayLessons = byDate.get(day) ?? []
          const isToday = day === today
          return (
            <button
              key={day}
              type="button"
              onClick={() => onOpenDay(day)}
              aria-label={`${formatDate(day)}: ${dayLessons.length} ta dars`}
              className={cn(
                'flex aspect-square flex-col rounded-xl border p-1.5 text-left transition-colors sm:aspect-auto sm:min-h-[104px]',
                isToday
                  ? 'border-blue-300 bg-blue-50/60 dark:border-blue-500/40 dark:bg-blue-500/10'
                  : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/30',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold tabular-nums',
                  isToday ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-200',
                )}
              >
                {dayOfMonth(day)}
              </span>
              {/* Kichik ekranda faqat nuqtalar */}
              <span className="mt-auto flex flex-wrap gap-0.5 sm:hidden">
                {dayLessons.slice(0, 4).map((lesson) => (
                  <span key={lesson.key} className={cn('h-1.5 w-1.5 rounded-full', accent[groupMap.get(lesson.groupId)?.color ?? 'blue'].solidBg)} />
                ))}
              </span>
              <span className="mt-1 hidden space-y-0.5 sm:block">
                {dayLessons.slice(0, MAX_CHIPS).map((lesson) => {
                  const group = groupMap.get(lesson.groupId)
                  const c = accent[group?.color ?? 'blue']
                  return (
                    <span key={lesson.key} className={cn('flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium', c.iconBg, c.iconText)}>
                      <span className="tabular-nums">{lesson.start}</span>
                      <span className="truncate">{group?.name}</span>
                    </span>
                  )
                })}
                {dayLessons.length > MAX_CHIPS ? (
                  <span className="block px-1 text-[10px] font-medium text-slate-400">+{dayLessons.length - MAX_CHIPS} ta</span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
