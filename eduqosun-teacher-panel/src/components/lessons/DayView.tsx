import { memo } from 'react'
import { ArrowRight, CalendarPlus, CalendarX2, Clock, Info, Users } from 'lucide-react'
import type { DateKey, Group, Lesson, LessonPhase } from '../../types'
import { lessonKindLabel } from '../../data/catalog'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { formatDuration } from '../../lib/date'
import { lessonDuration, lessonPhase, minutesUntilStart } from '../../domain/lessons'
import { useClock } from '../../store/clock'
import { openDrawer, openModal } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { GroupCodeTile, GroupGlyph } from '../ui/GroupIcon'
import { Menu } from '../ui/Menu'
import { LessonCountdownBadge } from '../ui/StatusBadges'
import { lessonMenuItems } from './lessonActions'

interface LessonRowProps {
  lesson: Lesson
  group: Group
  phase: LessonPhase
  minutesLeft: number
  studentCount: number
}

/** Dars qatori: vaqt · guruh · fan · holat · amallar */
const LessonRow = memo(function LessonRow({ lesson, group, phase, minutesLeft, studentCount }: LessonRowProps) {
  const live = phase === 'live'
  const open = () => openDrawer({ type: 'lesson', lessonKey: lesson.key })
  return (
    <li
      className={cn(
        'group grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 rounded-xl border border-l-4 p-4 transition-all hover:shadow-md md:grid-cols-[150px_minmax(0,1.1fr)_minmax(0,1fr)_auto] min-[1800px]:grid-cols-[160px_minmax(0,1.1fr)_minmax(0,1fr)_190px_auto]',
        live
          ? 'border-emerald-200 border-l-emerald-500 bg-emerald-50/60 dark:border-emerald-500/30 dark:border-l-emerald-500 dark:bg-emerald-500/10'
          : cn('border-slate-200/80 bg-white dark:border-slate-700/60 dark:bg-slate-800', accent[group.color].leftBorder),
        phase === 'canceled' && 'opacity-60',
      )}
      onClick={open}
    >
      {/* Vaqt */}
      <div className="flex items-start gap-2.5">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <div>
          <p className={cn('text-sm font-semibold tabular-nums text-slate-900 dark:text-white', phase === 'canceled' && 'line-through')}>
            {lesson.start} – {lesson.end}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatDuration(lessonDuration(lesson))}</p>
        </div>
      </div>

      {/* Guruh */}
      <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
        <GroupCodeTile name={group.name} color={group.color} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {group.name} ({group.direction})
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {studentCount} o'quvchi
            {lesson.isExtra ? <span className="rounded bg-violet-50 px-1.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">Qo'shimcha</span> : null}
          </p>
        </div>
      </div>

      {/* Fan va mavzu */}
      <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <GroupGlyph icon={group.icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100" title={lesson.topic}>
            {group.subject}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400" title={lesson.topic}>
            {lessonKindLabel[lesson.kind]} · {lesson.topic}
          </p>
        </div>
      </div>

      {/* Holat */}
      <div className="md:col-start-1 md:row-start-2 min-[1800px]:col-start-auto min-[1800px]:row-start-auto">
        <LessonCountdownBadge phase={phase} minutesLeft={minutesLeft} />
      </div>

      {/* Amallar */}
      <div
        className="col-start-2 row-start-1 flex items-center justify-end gap-1 md:col-start-4 min-[1800px]:col-start-5"
        onClick={(event) => event.stopPropagation()}
      >
        <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={open} className="text-blue-600 dark:text-blue-400">
          Batafsil
        </Button>
        <Menu label={`${group.name} ${lesson.start} — amallar`} items={lessonMenuItems(lesson, group)} />
      </div>
    </li>
  )
})

interface DayViewProps {
  date: DateKey
  lessons: Lesson[]
  groupMap: Map<string, Group>
  rosterSize: (groupId: string) => number
}

/** Bir kunlik darslar ro'yxati */
export function DayView({ date, lessons, groupMap, rosterSize }: DayViewProps) {
  const { today, minutes } = useClock()

  if (lessons.length === 0) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="Bu kunda dars yo'q"
        message="Jadvalda darslar yo'q. Qo'shimcha mashg'ulot rejalashtirishingiz mumkin."
        action={
          <Button icon={CalendarPlus} onClick={() => openModal({ type: 'lesson-form', date })}>
            Dars qo'shish
          </Button>
        }
      />
    )
  }

  return (
    <>
      <ul className="space-y-3">
        {lessons.map((lesson) => {
          const group = groupMap.get(lesson.groupId)
          if (!group) return null
          return (
            <LessonRow
              key={lesson.key}
              lesson={lesson}
              group={group}
              phase={lessonPhase(lesson, today, minutes)}
              minutesLeft={date === today ? minutesUntilStart(lesson, minutes) : 0}
              studentCount={rosterSize(group.id)}
            />
          )
        })}
      </ul>
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
        <Info className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
        <span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">Eslatma:</span> Dars vaqtlari o'zgarishi mumkin. O'quvchilarga
          oldindan xabar bering.
        </span>
      </p>
    </>
  )
}
