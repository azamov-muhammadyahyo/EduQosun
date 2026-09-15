import { CalendarDays, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { todaySchedule } from '../../data/schedule'
import type { LessonStatus, ScheduleLesson } from '../../types'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'
import { StatusBadge } from '../ui/StatusBadge'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'

const barColor: Record<LessonStatus, string> = {
  held: 'bg-emerald-500',
  now: 'bg-blue-500',
  planned: 'bg-slate-300 dark:bg-slate-600',
}

function ScheduleRow({ lesson }: { lesson: ScheduleLesson }) {
  const isNow = lesson.status === 'now'
  return (
    <li
      className={`relative flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border p-3.5 pl-5 transition-colors ${
        isNow
          ? 'border-blue-200 bg-blue-50/70 dark:border-blue-500/30 dark:bg-blue-500/10'
          : 'border-slate-100 hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/30'
      }`}
    >
      <span
        className={`absolute bottom-2 left-0 top-2 w-1 rounded-full ${barColor[lesson.status]}`}
        aria-hidden="true"
      />

      {/* Vaqt (yuqorida) + dars nomi (pastda) */}
      <div className="min-w-[150px] flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {lesson.timeStart} – {lesson.timeEnd}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{lesson.title}</p>
      </div>

      {/* Guruh */}
      <span className="inline-flex w-16 items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        {lesson.group}
      </span>

      {/* Holat */}
      <StatusBadge status={lesson.status} />

      {/* Batafsil */}
      <div className="ml-auto flex items-center gap-1">
        <Button variant={isNow ? 'primary' : 'secondary'} size="sm">
          Batafsil
        </Button>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600"
          aria-hidden="true"
        />
      </div>
    </li>
  )
}

/** Bugungi dars jadvali (§7.5) */
export function TodaySchedule() {
  return (
    <SectionCard
      title="Bugungi dars jadvali"
      icon={CalendarDays}
      bodyClassName="p-4"
      action={
        <>
          <SeeAllLink label="Barcha darslar" className="mr-1" />
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            aria-label="Oldingi kun"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            aria-label="Keyingi kun"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      }
    >
      {todaySchedule.length > 0 ? (
        <ul className="space-y-2.5">
          {todaySchedule.map((lesson) => (
            <ScheduleRow key={lesson.id} lesson={lesson} />
          ))}
        </ul>
      ) : (
        <EmptyState message="Bugun rejalashtirilgan dars yo'q" icon={CalendarDays} />
      )}
    </SectionCard>
  )
}
