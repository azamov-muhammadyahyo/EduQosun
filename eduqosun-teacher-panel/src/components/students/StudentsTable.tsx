import { memo } from 'react'
import { TriangleAlert } from 'lucide-react'
import type { Group, Student } from '../../types'
import { rateTone } from '../../lib/colors'
import { cn } from '../../lib/cn'
import type { StudentMetrics } from '../../domain/analytics'
import { fullName } from '../../domain/students'
import { openDrawer } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Checkbox } from '../ui/Form'
import { Menu } from '../ui/Menu'
import { ProgressBar } from '../ui/ProgressBar'
import { ScoreBadge, StudentStatusBadge } from '../ui/StatusBadges'
import { studentMenuItems } from './studentActions'

export interface StudentRow {
  student: Student
  group: Group | undefined
  metrics: StudentMetrics | undefined
}

interface StudentsTableProps {
  rows: StudentRow[]
  selected: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (checked: boolean) => void
}

const rateText: Record<ReturnType<typeof rateTone>, string> = {
  green: 'text-emerald-600 dark:text-emerald-400',
  blue: 'text-blue-600 dark:text-blue-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  slate: 'text-slate-400',
}

const Row = memo(function Row({ row, checked, onToggle }: { row: StudentRow; checked: boolean; onToggle: (id: string) => void }) {
  const { student, group, metrics } = row
  const name = fullName(student)
  const rate = metrics?.attendanceRate ?? null
  const tone = rateTone(rate)
  return (
    <tr
      onClick={() => openDrawer({ type: 'student', studentId: student.id })}
      className={cn(
        'cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/30',
        checked && 'bg-blue-50/60 dark:bg-blue-500/10',
      )}
    >
      <td className="w-10 py-3 pl-3 pr-1" onClick={(event) => event.stopPropagation()}>
        <Checkbox checked={checked} onChange={() => onToggle(student.id)} ariaLabel={`${name}ni tanlash`} />
      </td>
      <td className="px-2.5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={name} color={student.color} size="sm" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-medium text-slate-800 dark:text-slate-100">
              <span className="truncate">{name}</span>
              {metrics?.atRisk ? (
                <span title={metrics.riskReasons.join(', ')} className="shrink-0 text-amber-500">
                  <TriangleAlert className="h-3.5 w-3.5" aria-label="E'tibor talab qiladi" />
                </span>
              ) : null}
            </p>
            <p className="truncate text-xs tabular-nums text-slate-500 dark:text-slate-400">
              <span className="lg:hidden">{group?.name} · </span>
              {student.phone}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-2.5 py-3 lg:table-cell">
        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
          {group?.name ?? '—'}
        </span>
        <span className="mt-0.5 block max-w-[140px] truncate text-xs text-slate-400">{group?.course}</span>
      </td>
      <td className="hidden w-36 px-2.5 py-3 md:table-cell">
        <div className="flex items-center gap-2">
          <ProgressBar value={rate ?? 0} color={tone} size="xs" className="flex-1" />
          <span className={cn('w-9 text-right text-xs font-semibold tabular-nums', rateText[tone])}>
            {rate === null ? '—' : `${Math.round(rate)}%`}
          </span>
        </div>
      </td>
      <td className="px-2.5 py-3 text-center">
        <ScoreBadge value={metrics?.gradeAverage ?? null} />
      </td>
      <td className="hidden whitespace-nowrap px-2.5 py-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300 xl:table-cell">
        {metrics && metrics.assignmentsTotal > 0 ? `${metrics.assignmentsDone}/${metrics.assignmentsTotal}` : '—'}
      </td>
      <td className="hidden whitespace-nowrap px-2.5 py-3 text-center min-[1600px]:table-cell">
        <span className="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
          {metrics?.score === null || metrics?.score === undefined ? '—' : Math.round(metrics.score)}
        </span>
      </td>
      <td className="hidden px-2.5 py-3 sm:table-cell">
        <StudentStatusBadge status={student.status} size="xs" />
      </td>
      <td className="py-3 pl-1 pr-3 text-right" onClick={(event) => event.stopPropagation()}>
        <Menu label={`${name} — amallar`} items={studentMenuItems(student, group?.name ?? '')} />
      </td>
    </tr>
  )
})

/** O'quvchilar jadvali: tor ekranlarda ikkinchi darajali ustunlar yashiriladi */
export function StudentsTable({ rows, selected, onToggle, onToggleAll }: StudentsTableProps) {
  const allChecked = rows.length > 0 && rows.every((row) => selected.has(row.student.id))
  const someChecked = rows.some((row) => selected.has(row.student.id))
  const head = 'px-2.5 py-3 font-semibold'
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="bg-slate-50 text-xs text-slate-600 dark:bg-slate-700/30 dark:text-slate-300">
          <th scope="col" className="w-10 rounded-l-lg py-3 pl-3 pr-1">
            <Checkbox
              checked={allChecked}
              indeterminate={someChecked}
              onChange={onToggleAll}
              ariaLabel="Sahifadagi barcha o'quvchilarni tanlash"
            />
          </th>
          <th scope="col" className={head}>
            O'quvchi
          </th>
          <th scope="col" className={cn(head, 'hidden lg:table-cell')}>
            Guruh
          </th>
          <th scope="col" className={cn(head, 'hidden md:table-cell')}>
            Davomat
          </th>
          <th scope="col" className={cn(head, 'text-center')}>
            Baho
          </th>
          <th scope="col" className={cn(head, 'hidden text-center xl:table-cell')}>
            Topshiriqlar
          </th>
          <th scope="col" className={cn(head, 'hidden text-center min-[1600px]:table-cell')}>
            Reyting
          </th>
          <th scope="col" className={cn(head, 'hidden sm:table-cell')}>
            Holat
          </th>
          <th scope="col" className="rounded-r-lg py-3 pl-1 pr-3">
            <span className="sr-only">Amallar</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
        {rows.map((row) => (
          <Row key={row.student.id} row={row} checked={selected.has(row.student.id)} onToggle={onToggle} />
        ))}
      </tbody>
    </table>
  )
}
