import { memo } from 'react'
import { BellRing, CalendarClock, ClipboardCheck, Copy, Lock, LockOpen, Megaphone, PencilLine, Star, Trash2, Users } from 'lucide-react'
import type { Assignment, Group } from '../../types'
import { cn } from '../../lib/cn'
import { formatDateTime, formatNumericDate } from '../../lib/date'
import { percent } from '../../lib/format'
import { dueLabel, type AssignmentProgress } from '../../domain/assignments'
import { announceAssignment, deleteAssignment, duplicateAssignment, remindStudents, setAssignmentStatus } from '../../store/actions/assignments'
import { runWithUndo } from '../../store/actions/undo'
import { notify } from '../../store/toastStore'
import { confirmAction, openDrawer, openModal } from '../../store/uiStore'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { GroupTile } from '../ui/GroupIcon'
import { Menu, type MenuItem } from '../ui/Menu'
import { StackedBar } from '../shared/StackedBar'

export interface AssignmentItem {
  assignment: Assignment
  group: Group | undefined
  progress: AssignmentProgress
  missingIds: string[]
}

interface AssignmentCardProps {
  item: AssignmentItem
  today: string
}

function menuItems({ assignment, group, missingIds }: AssignmentItem): MenuItem[] {
  const closed = assignment.status === 'closed'
  return [
    { id: 'edit', label: 'Tahrirlash', icon: PencilLine, onSelect: () => openModal({ type: 'assignment-form', assignmentId: assignment.id }) },
    {
      id: 'announce',
      label: "Guruhga e'lon qilish",
      icon: Megaphone,
      onSelect: () => {
        announceAssignment(assignment)
        notify.success("E'lon yuborildi", `${group?.name ?? ''} guruhi chatiga xabar jo'natildi.`)
      },
    },
    {
      id: 'remind',
      label: `Topshirmaganlarga eslatma (${missingIds.length})`,
      icon: BellRing,
      disabled: missingIds.length === 0 || closed,
      onSelect: () => {
        const sent = remindStudents(assignment.id, missingIds)
        notify.success('Eslatma yuborildi', `${sent} ta o'quvchiga shaxsiy xabar jo'natildi.`)
      },
    },
    {
      id: 'duplicate',
      label: 'Nusxa olish',
      icon: Copy,
      onSelect: () => {
        const copy = duplicateAssignment(assignment.id, assignment.groupId)
        if (copy) notify.success('Nusxa yaratildi', copy.title)
      },
    },
    {
      id: 'status',
      label: closed ? 'Qayta ochish' : 'Yakunlash',
      icon: closed ? LockOpen : Lock,
      divider: true,
      onSelect: () => {
        setAssignmentStatus(assignment.id, closed ? 'active' : 'closed')
        notify.success(closed ? 'Topshiriq qayta ochildi' : 'Topshiriq yakunlandi', assignment.title)
      },
    },
    {
      id: 'delete',
      label: "O'chirish",
      icon: Trash2,
      tone: 'danger',
      onSelect: async () => {
        const ok = await confirmAction({
          title: "Topshiriqni o'chirish",
          message: `«${assignment.title}» va unga yuborilgan barcha javoblar o'chiriladi.`,
          confirmLabel: "O'chirish",
        })
        if (ok) runWithUndo("Topshiriq o'chirildi", () => deleteAssignment(assignment.id), assignment.title)
      },
    },
  ]
}

/** Topshiriq kartochkasi: holat, muddat, topshirish jarayoni va amallar */
export const AssignmentCard = memo(function AssignmentCard({ item, today }: AssignmentCardProps) {
  const { assignment, group, progress } = item
  const closed = assignment.status === 'closed'
  const due = dueLabel(assignment.dueDate, today)
  const open = () => openDrawer({ type: 'assignment-review', assignmentId: assignment.id })

  return (
    <article
      onClick={open}
      className={cn(
        'group flex cursor-pointer flex-col gap-4 rounded-2xl border bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift dark:bg-slate-800 lg:flex-row lg:items-center',
        progress.pending > 0 && !closed ? 'border-amber-200 dark:border-amber-500/30' : 'border-slate-200/80 dark:border-slate-700/60',
        closed && 'opacity-75',
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        {group ? <GroupTile icon={group.icon} color={group.color} size="md" muted={closed} /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge color={group?.color ?? 'slate'} size="xs" icon={Users}>
              {group?.name ?? '—'}
            </Badge>
            {closed ? (
              <Badge color="slate" size="xs" icon={Lock}>
                Yakunlangan
              </Badge>
            ) : (
              <Badge color={due.tone === 'danger' ? 'rose' : due.tone === 'warning' ? 'amber' : 'blue'} size="xs" icon={CalendarClock}>
                {due.text}
              </Badge>
            )}
            {progress.pending > 0 ? (
              <Badge color="amber" size="xs" dot pulse={!closed}>
                {progress.pending} ta tekshirilmagan
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-1.5 line-clamp-1 text-[15px] font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            {assignment.title}
          </h3>
          {assignment.description ? (
            <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500 dark:text-slate-400">{assignment.description}</p>
          ) : null}
          <p className="mt-1.5 text-xs text-slate-400">
            Berilgan: {formatDateTime(assignment.createdAt)} · Muddat: {formatNumericDate(assignment.dueDate)} {assignment.dueTime} · Maks. {assignment.maxScore} ball
          </p>
        </div>
      </div>

      <div className="w-full shrink-0 lg:w-56">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Topshirdi</span>
          <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
            {progress.submitted}/{progress.total} <span className="font-normal text-slate-400">({percent(progress.submitted, progress.total)}%)</span>
          </span>
        </div>
        <StackedBar
          className="mt-1.5"
          segments={[
            { id: 'graded', value: progress.graded, fillClass: 'fill-emerald-500', label: 'Baholangan' },
            { id: 'pending', value: progress.pending, fillClass: 'fill-amber-400', label: 'Tekshirilmagan' },
            { id: 'missing', value: progress.missing, fillClass: 'fill-slate-200 dark:fill-slate-600', label: 'Topshirmagan' },
          ]}
        />
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            {progress.late > 0 ? `${progress.late} ta kechikkan · ` : ''}
            {progress.missing} ta topshirmagan
          </span>
          {progress.averageScore !== null ? (
            <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600 dark:text-amber-400">
              <Star className="h-3 w-3" aria-hidden="true" />
              {progress.averageScore.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
        <Button size="sm" variant={progress.pending > 0 && !closed ? 'primary' : 'secondary'} icon={ClipboardCheck} onClick={open}>
          Tekshirish
        </Button>
        <Menu label={`${assignment.title} — amallar`} items={menuItems(item)} />
      </div>
    </article>
  )
})
