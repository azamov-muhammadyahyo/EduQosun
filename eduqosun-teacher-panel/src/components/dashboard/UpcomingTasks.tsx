import { useMemo } from 'react'
import { CalendarClock, ClipboardList, Pin, Plus } from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatNumericDate } from '../../lib/date'
import { assignmentProgress, assignmentRoster, dueLabel } from '../../domain/assignments'
import { useGroupMap } from '../../hooks/useData'
import { navigateTo } from '../../router'
import { useApp } from '../../store/appStore'
import { useClock } from '../../store/clock'
import { openDrawer, openModal } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { IconBox } from '../ui/IconBox'
import { SectionCard } from '../ui/SectionCard'
import { SeeAllLink } from '../ui/SeeAllLink'

const LIMIT = 4

/** Keyingi vazifalar: muddati yaqin va tekshirilishi kerak bo'lgan topshiriqlar */
export function UpcomingTasks() {
  const assignments = useApp((s) => s.assignments)
  const submissions = useApp((s) => s.submissions)
  const students = useApp((s) => s.students)
  const groupMap = useGroupMap()
  const { today } = useClock()

  const items = useMemo(
    () =>
      assignments
        .filter((a) => a.status === 'active')
        .map((assignment) => ({
          assignment,
          progress: assignmentProgress(assignment, assignmentRoster(assignment, students), submissions[assignment.id]),
        }))
        // Tekshirilmagan javobi borlar va muddati yaqinlar birinchi
        .sort((a, b) => {
          const aOverdue = a.assignment.dueDate < today
          const bOverdue = b.assignment.dueDate < today
          if (aOverdue !== bOverdue) return aOverdue ? 1 : -1
          return a.assignment.dueDate.localeCompare(b.assignment.dueDate)
        })
        .filter(({ assignment, progress }) => assignment.dueDate >= today || progress.pending > 0)
        .slice(0, LIMIT),
    [assignments, students, submissions, today],
  )

  return (
    <SectionCard
      title="Keyingi vazifalar"
      icon={Pin}
      action={<SeeAllLink onClick={() => navigateTo('tasks')} />}
      className="h-full"
      bodyClassName="px-5 py-1"
    >
      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          message="Faol topshiriq yo'q"
          action={
            <Button size="sm" variant="soft" icon={Plus} onClick={() => openModal({ type: 'assignment-form' })}>
              Topshiriq berish
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {items.map(({ assignment, progress }) => {
            const group = groupMap.get(assignment.groupId)
            const due = dueLabel(assignment.dueDate, today)
            return (
              <li key={assignment.id} className="flex gap-3 py-3.5">
                <IconBox icon={ClipboardList} color={group?.color ?? 'blue'} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                        {group?.name}
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{group?.subject}</span>
                    </p>
                    <Button
                      variant={progress.pending > 0 ? 'primary' : 'soft'}
                      size="sm"
                      className="shrink-0"
                      onClick={() => openDrawer({ type: 'assignment-review', assignmentId: assignment.id })}
                    >
                      Tekshirish{progress.pending > 0 ? ` (${progress.pending})` : ''}
                    </Button>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500 dark:text-slate-400">«{assignment.title}»</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-400">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="font-medium tabular-nums text-slate-600 dark:text-slate-300">{formatNumericDate(assignment.dueDate)}</span>
                    <span
                      className={cn(
                        due.tone === 'danger' && 'text-rose-500',
                        due.tone === 'warning' && 'text-amber-600 dark:text-amber-400',
                      )}
                    >
                      · {due.text}
                    </span>
                    <span>
                      · {progress.submitted}/{progress.total} topshirdi
                    </span>
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
