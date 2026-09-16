import { memo } from 'react'
import { CalendarCheck, ClipboardCheck, Star, TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatScore } from '../../lib/format'
import { fullName } from '../../domain/students'
import { openDrawer } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Checkbox } from '../ui/Form'
import { Menu } from '../ui/Menu'
import { StudentStatusBadge } from '../ui/StatusBadges'
import { studentMenuItems } from './studentActions'
import type { StudentRow } from './StudentsTable'

interface StudentCardProps {
  row: StudentRow
  checked: boolean
  onToggle: (id: string) => void
}

/** O'quvchi kartochkasi (to'r ko'rinishi) */
export const StudentCard = memo(function StudentCard({ row, checked, onToggle }: StudentCardProps) {
  const { student, group, metrics } = row
  const name = fullName(student)
  const stats = [
    { icon: CalendarCheck, label: 'Davomat', value: metrics?.attendanceRate == null ? '—' : `${Math.round(metrics.attendanceRate)}%` },
    { icon: Star, label: 'Baho', value: formatScore(metrics?.gradeAverage ?? null) },
    {
      icon: ClipboardCheck,
      label: 'Vazifa',
      value: metrics && metrics.assignmentsTotal > 0 ? `${metrics.assignmentsDone}/${metrics.assignmentsTotal}` : '—',
    },
  ]

  return (
    <article
      className={cn(
        'group relative flex cursor-pointer flex-col rounded-2xl border bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift dark:bg-slate-800',
        checked ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-slate-200/80 dark:border-slate-700/60',
      )}
      onClick={() => openDrawer({ type: 'student', studentId: student.id })}
    >
      <div className="flex items-start justify-between" onClick={(event) => event.stopPropagation()}>
        <Checkbox checked={checked} onChange={() => onToggle(student.id)} ariaLabel={`${name}ni tanlash`} />
        <Menu label={`${name} — amallar`} items={studentMenuItems(student, group?.name ?? '')} />
      </div>
      <div className="-mt-3 flex flex-col items-center text-center">
        <Avatar name={name} color={student.color} size="xl" variant="solid" />
        <p className="mt-3 flex max-w-full items-center gap-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
          <span className="truncate">{name}</span>
          {metrics?.atRisk ? <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="E'tibor talab qiladi" /> : null}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {group ? `${group.name} · ${group.course}` : '—'}
        </p>
        <div className="mt-2">
          <StudentStatusBadge status={student.status} size="xs" />
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 py-2 dark:divide-slate-700 dark:bg-slate-900/40">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center gap-0.5 px-1">
            <dt className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <Icon className="h-3 w-3" aria-hidden="true" />
              {label}
            </dt>
            <dd className="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
})
