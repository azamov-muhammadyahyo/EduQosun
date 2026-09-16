import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import type { DateKey, Lesson, LessonPhase } from '../../types'
import { cn } from '../../lib/cn'
import { addDays, formatDayHeading } from '../../lib/date'
import { lessonPhase } from '../../domain/lessons'
import { useGroupMap, useLessonsOn } from '../../hooks/useData'
import { navigateTo } from '../../router'
import { useClock } from '../../store/clock'
import { openDrawer, openModal } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'
import { LessonPhaseBadge } from '../ui/StatusBadges'

const barColor: Record<LessonPhase, string> = {
  held: 'bg-emerald-500',
  live: 'bg-blue-500',
  upcoming: 'bg-slate-300 dark:bg-slate-600',
  planned: 'bg-slate-300 dark:bg-slate-600',
  canceled: 'bg-rose-400',
}

interface ScheduleRowProps {
  lesson: Lesson
  phase: LessonPhase
  groupName: string
  subject: string
}

function ScheduleRow({ lesson, phase, groupName, subject }: ScheduleRowProps) {
  const live = phase === 'live'
  const open = () => openDrawer({ type: 'lesson', lessonKey: lesson.key })
  return (
    <li
      className={cn(
        'group relative flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border p-3.5 pl-5 transition-colors',
        live
          ? 'border-blue-200 bg-blue-50/70 dark:border-blue-500/30 dark:bg-blue-500/10'
          : 'border-slate-100 hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/30',
        phase === 'canceled' && 'opacity-70',
      )}
      onClick={open}
    >
      <span className={cn('absolute bottom-2 left-0 top-2 w-1 rounded-full', barColor[phase])} aria-hidden="true" />

      <div className="min-w-[150px] flex-1">
        <p className={cn('text-sm font-semibold tabular-nums text-slate-900 dark:text-white', phase === 'canceled' && 'line-through')}>
          {lesson.start} – {lesson.end}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400" title={lesson.topic}>
          {subject} · {lesson.topic}
        </p>
      </div>

      <span className="inline-flex w-16 items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        {groupName}
      </span>

      <LessonPhaseBadge phase={phase} />

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant={live ? 'primary' : 'secondary'}
          size="sm"
          onClick={(event) => {
            event.stopPropagation()
            open()
          }}
        >
          Batafsil
        </Button>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600"
          aria-hidden="true"
        />
      </div>
    </li>
  )
}

interface TodayScheduleProps {
  date: DateKey
  onDateChange: (date: DateKey) => void
}

/** Tanlangan kunning dars jadvali (standart — bugun) */
export function TodaySchedule({ date, onDateChange }: TodayScheduleProps) {
  const lessons = useLessonsOn(date)
  const groupMap = useGroupMap()
  const { today, minutes } = useClock()
  const heading = date === today ? 'Bugungi dars jadvali' : `Dars jadvali · ${formatDayHeading(date, today)}`

  return (
    <SectionCard
      title={heading}
      icon={CalendarDays}
      className="h-full"
      bodyClassName="p-4"
      action={
        <>
          <SeeAllLink label="Barcha darslar" className="mr-1" onClick={() => navigateTo('lessons', null, { date })} />
          <button
            type="button"
            onClick={() => onDateChange(addDays(date, -1))}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            aria-label="Oldingi kun"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDateChange(addDays(date, 1))}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            aria-label="Keyingi kun"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      }
    >
      {lessons.length > 0 ? (
        <ul className="space-y-2.5">
          {lessons.map((lesson) => {
            const group = groupMap.get(lesson.groupId)
            return (
              <ScheduleRow
                key={lesson.key}
                lesson={lesson}
                phase={lessonPhase(lesson, today, minutes)}
                groupName={group?.name ?? '—'}
                subject={group?.subject ?? ''}
              />
            )
          })}
        </ul>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Dars yo'q"
          message={date === today ? "Bugun rejalashtirilgan dars yo'q." : "Bu kunda rejalashtirilgan dars yo'q."}
          action={
            <Button size="sm" variant="soft" icon={CalendarPlus} onClick={() => openModal({ type: 'lesson-form', date })}>
              Dars qo'shish
            </Button>
          }
        />
      )}
      {date !== today ? (
        <button
          type="button"
          onClick={() => onDateChange(today)}
          className="mt-3 w-full rounded-lg py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
        >
          Bugunga qaytish
        </button>
      ) : null}
    </SectionCard>
  )
}
