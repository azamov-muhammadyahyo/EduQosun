import { useMemo } from 'react'
import { CalendarClock, Radio } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { formatShortDuration } from '../../../lib/date'
import { lessonPhase, minutesUntilEnd, minutesUntilStart } from '../../../domain/lessons'
import { useGroupMap, useLessonsOn } from '../../../hooks/useData'
import { useClock } from '../../../store/clock'
import { openDrawer } from '../../../store/uiStore'

/** Topbar'dagi "hozirgi / keyingi dars" ko'rsatkichi — bosilganda dars tafsilotlari ochiladi */
export function CurrentLessonPill({ className }: { className?: string }) {
  const { today, minutes } = useClock()
  const lessons = useLessonsOn(today)
  const groups = useGroupMap()

  const target = useMemo(() => {
    const active = lessons.filter((lesson) => !lesson.canceled)
    const live = active.find((lesson) => lessonPhase(lesson, today, minutes) === 'live')
    if (live) return { lesson: live, live: true }
    const next = active.find((lesson) => lessonPhase(lesson, today, minutes) === 'upcoming')
    return next ? { lesson: next, live: false } : null
  }, [lessons, today, minutes])

  if (!target) return null
  const group = groups.get(target.lesson.groupId)
  if (!group) return null

  const { lesson, live } = target
  const text = live
    ? `${formatShortDuration(minutesUntilEnd(lesson, minutes))} qoldi`
    : `${lesson.start} · ${formatShortDuration(minutesUntilStart(lesson, minutes))}dan so'ng`

  return (
    <button
      type="button"
      onClick={() => openDrawer({ type: 'lesson', lessonKey: lesson.key })}
      className={cn(
        'group inline-flex min-w-0 items-center gap-2.5 rounded-xl border py-1.5 pl-2 pr-3 text-left transition-colors',
        live
          ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15'
          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/60',
        className,
      )}
      title="Dars tafsilotlarini ochish"
    >
      <span
        className={cn(
          'relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          live ? 'bg-emerald-500 text-white' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
        )}
      >
        {live ? <Radio className="h-4 w-4" aria-hidden="true" /> : <CalendarClock className="h-4 w-4" aria-hidden="true" />}
        {live ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300 ring-2 ring-white dark:ring-slate-900" /> : null}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {live ? 'Hozirgi dars' : 'Keyingi dars'}
        </span>
        <span className="block truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
          {group.name} · {group.subject}
          <span className={cn('ml-1.5 font-medium', live ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400')}>
            {text}
          </span>
        </span>
      </span>
    </button>
  )
}
