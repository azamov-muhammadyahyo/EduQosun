import { useMemo } from 'react'
import { History } from 'lucide-react'
import { addDays, formatNumericDate } from '../../lib/date'
import { summarize } from '../../domain/attendance'
import { lessonPhase } from '../../domain/lessons'
import { useGroupMap, useLessonsInRange } from '../../hooks/useData'
import { navigateTo } from '../../router'
import { useApp } from '../../store/appStore'
import { useClock } from '../../store/clock'
import { openDrawer } from '../../store/uiStore'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { GroupTile } from '../ui/GroupIcon'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'
import { LessonPhaseBadge } from '../ui/StatusBadges'

const LIMIT = 5

/** Oxirgi o'tkazilgan darslar va ularning davomati */
export function RecentLessons() {
  const { today, minutes } = useClock()
  const lessons = useLessonsInRange(addDays(today, -21), today)
  const attendance = useApp((s) => s.attendance)
  const groupMap = useGroupMap()

  const rows = useMemo(
    () =>
      lessons
        .map((lesson) => ({ lesson, phase: lessonPhase(lesson, today, minutes) }))
        .filter(({ phase }) => phase === 'held' || phase === 'canceled')
        .sort((a, b) => (b.lesson.date + b.lesson.start).localeCompare(a.lesson.date + a.lesson.start))
        .slice(0, LIMIT),
    [lessons, today, minutes],
  )

  return (
    <SectionCard
      title="Oxirgi darslar"
      icon={History}
      action={<SeeAllLink onClick={() => navigateTo('lessons', null, { view: 'list' })} />}
      className="h-full"
      bodyClassName="pb-2"
    >
      {rows.length === 0 ? (
        <EmptyState icon={History} message="Hali o'tkazilgan dars yo'q" />
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/30 dark:text-slate-400">
              <th scope="col" className="py-2.5 pl-5 pr-3 font-medium">
                Sana
              </th>
              <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">
                Guruh
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                Mavzu
              </th>
              <th scope="col" className="py-2.5 pl-3 pr-5 text-right font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {rows.map(({ lesson, phase }) => {
              const group = groupMap.get(lesson.groupId)
              const record = attendance[lesson.key]
              const summary = summarize(record)
              const came = summary.present + summary.late
              return (
                <tr
                  key={lesson.key}
                  onClick={() => openDrawer({ type: 'lesson', lessonKey: lesson.key })}
                  className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
                >
                  <td className="whitespace-nowrap py-3 pl-5 pr-3">
                    <p className="font-medium tabular-nums text-slate-700 dark:text-slate-200">{formatNumericDate(lesson.date)}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-slate-400">
                      {lesson.start} – {lesson.end}
                    </p>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-3 sm:table-cell">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                      {group?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {group ? <GroupTile icon={group.icon} color={group.color} size="sm" className="hidden md:inline-flex" /> : null}
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium text-slate-800 dark:text-slate-100">{lesson.topic}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {group?.subject}
                          {phase === 'held' ? (record ? ` · ${came}/${summary.total} keldi` : ' · davomat olinmagan') : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                    {phase === 'held' && !record ? (
                      <Badge color="amber" dot size="xs">
                        Davomat yo'q
                      </Badge>
                    ) : (
                      <LessonPhaseBadge phase={phase} size="xs" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </SectionCard>
  )
}
