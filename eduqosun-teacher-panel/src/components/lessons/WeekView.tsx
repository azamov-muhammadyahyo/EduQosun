import { Plus } from 'lucide-react'
import type { DateKey, Group, Lesson } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { dayOfMonth, weekDates, weekdayName, WEEKDAYS_SHORT } from '../../lib/date'
import { lessonPhase } from '../../domain/lessons'
import { useClock } from '../../store/clock'
import { openDrawer, openModal } from '../../store/uiStore'

interface WeekViewProps {
  date: DateKey
  lessons: Lesson[]
  groupMap: Map<string, Group>
  onOpenDay: (date: DateKey) => void
}

/** Haftalik jadval: 7 ustun (tor ekranda — kunlar ketma-ket) */
export function WeekView({ date, lessons, groupMap, onOpenDay }: WeekViewProps) {
  const { today, minutes } = useClock()
  const days = weekDates(date)

  return (
    <div className="grid gap-3 lg:grid-cols-7 lg:gap-2">
      {days.map((day, index) => {
        const dayLessons = lessons.filter((l) => l.date === day)
        const isToday = day === today
        return (
          <section
            key={day}
            className={cn(
              'flex min-w-0 flex-col rounded-xl border p-2 lg:min-h-[320px]',
              isToday
                ? 'border-blue-200 bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-500/5'
                : 'border-slate-200/80 bg-slate-50/40 dark:border-slate-700/60 dark:bg-slate-900/20',
            )}
          >
            <button
              type="button"
              onClick={() => onOpenDay(day)}
              className="mb-2 flex items-center justify-between rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white dark:hover:bg-slate-800"
              title={`${weekdayName(day)} — kunlik ko'rinish`}
            >
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="lg:hidden">{weekdayName(day)}</span>
                <span className="hidden lg:inline">{WEEKDAYS_SHORT[index]}</span>
              </span>
              <span
                className={cn(
                  'inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-sm font-bold tabular-nums',
                  isToday ? 'bg-blue-600 text-white' : 'text-slate-800 dark:text-slate-100',
                )}
              >
                {dayOfMonth(day)}
              </span>
            </button>

            <ul className="flex-1 space-y-1.5">
              {dayLessons.map((lesson) => {
                const group = groupMap.get(lesson.groupId)
                if (!group) return null
                const c = accent[group.color]
                const phase = lessonPhase(lesson, today, minutes)
                return (
                  <li key={lesson.key}>
                    <button
                      type="button"
                      onClick={() => openDrawer({ type: 'lesson', lessonKey: lesson.key })}
                      className={cn(
                        'w-full rounded-lg border-l-[3px] bg-white px-2 py-1.5 text-left shadow-sm transition-all hover:-translate-y-px hover:shadow dark:bg-slate-800',
                        c.leftBorder,
                        phase === 'canceled' && 'opacity-50',
                        phase === 'live' && 'ring-2 ring-emerald-400',
                      )}
                      title={`${group.name} · ${lesson.topic}`}
                    >
                      <span className={cn('block text-[11px] font-semibold tabular-nums', c.iconText, phase === 'canceled' && 'line-through')}>
                        {lesson.start}–{lesson.end}
                      </span>
                      <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{group.name}</span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{lesson.topic}</span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <button
              type="button"
              onClick={() => openModal({ type: 'lesson-form', date: day })}
              className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-blue-300 hover:bg-white hover:text-blue-600 dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label={`${weekdayName(day)} kuniga dars qo'shish`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Dars
            </button>
          </section>
        )
      })}
    </div>
  )
}
