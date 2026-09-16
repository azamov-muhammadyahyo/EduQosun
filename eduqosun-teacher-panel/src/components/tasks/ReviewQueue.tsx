import { useMemo } from 'react'
import { CalendarClock, Inbox } from 'lucide-react'
import type { Assignment, Group, Student, Submission } from '../../types'
import { formatRelativeDay, formatTimeAgo } from '../../lib/date'
import { isLateSubmission } from '../../domain/assignments'
import { fullName } from '../../domain/students'
import { useClock } from '../../store/clock'
import { openDrawer } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { GroupTile } from '../ui/GroupIcon'
import { PanelHeader } from '../ui/PanelHeader'

interface ReviewQueueProps {
  assignments: Assignment[]
  submissions: Record<string, Record<string, Submission>>
  studentMap: Map<string, Student>
  groupMap: Map<string, Group>
}

const LIMIT = 7

/** O'ng ustun: tekshirilishi kerak bo'lgan so'nggi javoblar va yaqin muddatlar */
export function ReviewQueue({ assignments, submissions, studentMap, groupMap }: ReviewQueueProps) {
  const { now, today } = useClock()

  const queue = useMemo(() => {
    const items: { assignment: Assignment; submission: Submission; student: Student }[] = []
    for (const assignment of assignments) {
      for (const submission of Object.values(submissions[assignment.id] ?? {})) {
        const student = studentMap.get(submission.studentId)
        if (student && submission.score === undefined) items.push({ assignment, submission, student })
      }
    }
    return items.sort((a, b) => b.submission.submittedAt.localeCompare(a.submission.submittedAt))
  }, [assignments, submissions, studentMap])

  const deadlines = useMemo(
    () =>
      assignments
        .filter((a) => a.status === 'active' && a.dueDate >= today)
        .sort((a, b) => (a.dueDate + a.dueTime).localeCompare(b.dueDate + b.dueTime))
        .slice(0, 5),
    [assignments, today],
  )

  return (
    <div className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
      <Card className="p-5">
        <PanelHeader
          title="Tekshirish navbati"
          icon={Inbox}
          subtitle="Baholanmagan javoblar"
          action={queue.length > 0 ? <Badge color="amber">{queue.length}</Badge> : null}
        />
        {queue.length === 0 ? (
          <EmptyState compact icon={Inbox} message="Hamma javoblar tekshirilgan. Barakalla!" />
        ) : (
          <ul className="mt-3 space-y-1">
            {queue.slice(0, LIMIT).map(({ assignment, submission, student }) => (
              <li key={`${assignment.id}-${student.id}`}>
                <button
                  type="button"
                  onClick={() => openDrawer({ type: 'assignment-review', assignmentId: assignment.id })}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <Avatar name={fullName(student)} color={student.color} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{fullName(student)}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{assignment.title}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[11px] text-slate-400">{formatTimeAgo(submission.submittedAt, now)}</span>
                    {isLateSubmission(assignment, submission) ? <span className="text-[10px] font-semibold text-rose-500">kechikkan</span> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {queue.length > LIMIT ? <p className="mt-2 text-center text-xs text-slate-400">yana {queue.length - LIMIT} ta javob</p> : null}
      </Card>

      <Card className="p-5">
        <PanelHeader title="Yaqin muddatlar" icon={CalendarClock} subtitle="Faol topshiriqlar" />
        {deadlines.length === 0 ? (
          <EmptyState compact icon={CalendarClock} message="Yaqin muddatli topshiriq yo'q" />
        ) : (
          <ul className="mt-3 space-y-1">
            {deadlines.map((assignment) => {
              const group = groupMap.get(assignment.groupId)
              return (
                <li key={assignment.id}>
                  <button
                    type="button"
                    onClick={() => openDrawer({ type: 'assignment-review', assignmentId: assignment.id })}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  >
                    {group ? <GroupTile icon={group.icon} color={group.color} size="sm" /> : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{assignment.title}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{group?.name}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {formatRelativeDay(assignment.dueDate, today)}
                      <span className="block text-[11px] font-normal text-slate-400">{assignment.dueTime}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
