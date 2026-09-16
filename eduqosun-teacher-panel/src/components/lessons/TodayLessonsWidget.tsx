import { CalendarDays } from 'lucide-react'
import type { DateKey, Group, Lesson } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { dayOfMonth, formatDateWithWeekday, formatShortDuration, weekDates, WEEKDAYS_SHORT } from '../../lib/date'
import { lessonPhase, minutesUntilEnd, minutesUntilStart } from '../../domain/lessons'
import { useClock } from '../../store/clock'
import { openDrawer } from '../../store/uiStore'
import { Card } from '../ui/Card'
import { PanelHeader } from '../ui/PanelHeader'

interface TodayLessonsWidgetProps {
  date: DateKey
  onSelect: (date: DateKey) => void
  lessons: Lesson[]
  groupMap: Map<string, Group>
  /** Hafta kunlari bo'yicha darslar soni */
  weekCounts: Record<DateKey, number>
}

/** "Bugungi kun" — hafta tasmasi va tanlangan kun xulosasi */
export function TodayLessonsWidget({ date, onSelect, lessons, groupMap, weekCounts }: TodayLessonsWidgetProps) {
  const { today, minutes } = useClock()
  const active = lessons.filter((l) => !l.canceled)
  const first = active[0]
  const last = active[active.length - 1]

  const live = date === today ? active.find((l) => lessonPhase(l, today, minutes) === 'live') : undefined
  const next = date === today ? active.find((l) => lessonPhase(l, today, minutes) === 'upcoming') : undefined
  const focus = live ?? next
  const focusGroup = focus ? groupMap.get(focus.groupId) : undefined

  return (
    <Card className="p-5">
      <PanelHeader
        title={date === today ? 'Bugungi kun' : 'Tanlangan kun'}
        icon={CalendarDays}
        subtitle={formatDateWithWeekday(date)}
        action={
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            {active.length} dars
          </span>
        }
      />

      <div className="mt-4 grid grid-cols-7 gap-1 border-t border-slate-100 pt-3 text-center dark:border-slate-700/60">
        {weekDates(date).map((day, index) => {
          const selected = day === date
          const count = weekCounts[day] ?? 0
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              aria-pressed={selected}
              aria-label={`${formatDateWithWeekday(day)}: ${count} ta dars`}
              className="group flex flex-col items-center gap-1.5"
            >
              <span className={cn('text-xs font-medium', selected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400')}>
                {WEEKDAYS_SHORT[index]}
              </span>
              <span
                className={cn(
                  'relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold tabular-nums transition-colors',
                  selected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : day === today
                      ? 'text-blue-600 ring-1 ring-inset ring-blue-200 group-hover:bg-blue-50 dark:text-blue-400 dark:ring-blue-500/40'
                      : 'text-slate-700 group-hover:bg-slate-100 dark:text-slate-200 dark:group-hover:bg-slate-700',
                )}
              >
                {dayOfMonth(day)}
                {count > 0 && !selected ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-blue-500" aria-hidden="true" /> : null}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-700/60 dark:bg-slate-900/30">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Darslarim</p>
          <span className="text-xs text-blue-600 dark:text-blue-400">{active.length} dars</span>
        </div>
        {first && last ? (
          <>
            <p className="mt-1 text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {first.start} – {last.end}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {active.map((lesson) => (
                <button
                  key={lesson.key}
                  type="button"
                  onClick={() => openDrawer({ type: 'lesson', lessonKey: lesson.key })}
                  title={`${lesson.start} · ${groupMap.get(lesson.groupId)?.name ?? ''}`}
                  className={cn('h-2.5 w-2.5 rounded-full transition-transform hover:scale-125', accent[groupMap.get(lesson.groupId)?.color ?? 'blue'].solidBg)}
                  aria-label={`${lesson.start} dars`}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Bu kunda dars rejalashtirilmagan</p>
        )}
        {focus && focusGroup ? (
          <button
            type="button"
            onClick={() => openDrawer({ type: 'lesson', lessonKey: focus.key })}
            className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-left text-xs shadow-sm ring-1 ring-slate-100 transition-colors hover:ring-blue-200 dark:bg-slate-800 dark:ring-slate-700"
          >
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {live ? 'Hozirgi dars' : 'Keyingi dars'}: {focusGroup.name}
            </span>
            <span className="block text-slate-500 dark:text-slate-400">
              {focus.start} – {focus.end} ·{' '}
              {live
                ? `tugashiga ${formatShortDuration(minutesUntilEnd(focus, minutes))}`
                : `${formatShortDuration(minutesUntilStart(focus, minutes))} qoldi`}
            </span>
          </button>
        ) : null}
      </div>
    </Card>
  )
}
