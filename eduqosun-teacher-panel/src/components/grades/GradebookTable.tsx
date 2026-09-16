import { useCallback } from 'react'
import { ClipboardCheck, FileQuestion, PencilLine, Trash2 } from 'lucide-react'
import type { Student } from '../../types'
import { cn } from '../../lib/cn'
import { formatNumericDate } from '../../lib/date'
import { gradeFor, type GradeColumn, type GradeInputs } from '../../domain/grades'
import { fullName } from '../../domain/students'
import { deleteAssessment, setGrade } from '../../store/actions/grades'
import { runWithUndo } from '../../store/actions/undo'
import { confirmAction, openDrawer, openModal } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Menu, type MenuItem } from '../ui/Menu'
import { ScoreBadge } from '../ui/StatusBadges'
import { GradeCell } from './GradeCell'

const sourceBadge: Record<GradeColumn['source'], string> = {
  assessment: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  assignment: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  test: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
}

function columnMenu(column: GradeColumn): MenuItem[] {
  if (column.source === 'assignment') {
    return [
      { id: 'review', label: 'Javoblarni tekshirish', icon: ClipboardCheck, onSelect: () => openDrawer({ type: 'assignment-review', assignmentId: column.refId }) },
      { id: 'edit', label: 'Topshiriqni tahrirlash', icon: PencilLine, onSelect: () => openModal({ type: 'assignment-form', assignmentId: column.refId }) },
    ]
  }
  if (column.source === 'test') {
    return [{ id: 'results', label: "Natijalarni ko'rish", icon: FileQuestion, onSelect: () => openDrawer({ type: 'test-results', testId: column.refId }) }]
  }
  return [
    {
      id: 'edit',
      label: 'Ustunni tahrirlash',
      icon: PencilLine,
      onSelect: () => openModal({ type: 'assessment-form', groupId: column.groupId, assessmentId: column.refId }),
    },
    {
      id: 'delete',
      label: "Ustunni o'chirish",
      icon: Trash2,
      tone: 'danger',
      divider: true,
      onSelect: async () => {
        const ok = await confirmAction({
          title: "Ustunni o'chirish",
          message: `«${column.title}» ustuni va undagi barcha baholar o'chiriladi.`,
          confirmLabel: "O'chirish",
        })
        if (ok) runWithUndo("Ustun o'chirildi", () => deleteAssessment(column.refId), column.title)
      },
    },
  ]
}

export interface GradebookRow {
  student: Student
  values: (number | null)[]
  average: number | null
}

interface GradebookTableProps {
  columns: GradeColumn[]
  rows: GradebookRow[]
  inputs: GradeInputs
  columnAverages: (number | null)[]
}

/** Baholar jurnali: birinchi ustun (o'quvchi) gorizontal aylantirishda qotib turadi */
export function GradebookTable({ columns, rows, inputs, columnAverages }: GradebookTableProps) {
  const commit = useCallback(
    (column: GradeColumn, studentId: string) => (value: number | null) => {
      setGrade(column, studentId, value, gradeFor(column, studentId, inputs))
    },
    [inputs],
  )

  const stickyCell = 'sticky left-0 z-10 bg-white dark:bg-slate-800'

  return (
    <div className="scrollbar-thin -mx-4 overflow-x-auto sm:-mx-5">
      <table className="w-full min-w-max border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs text-slate-500 dark:text-slate-400">
            <th scope="col" className={cn(stickyCell, 'min-w-[220px] border-b border-slate-200 px-4 pb-3 align-bottom font-semibold sm:px-5 dark:border-slate-700')}>
              O'quvchi
            </th>
            {columns.map((column) => (
              <th key={column.id} scope="col" className="w-[76px] border-b border-slate-200 px-1 pb-3 align-bottom dark:border-slate-700">
                <div className="flex flex-col items-center gap-1">
                  <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', sourceBadge[column.source])}>{column.typeLabel}</span>
                  <Menu
                    label={`${column.title} — amallar`}
                    placement="bottom-start"
                    items={columnMenu(column)}
                    trigger={({ open, toggle, ref, id }) => (
                      <button
                        ref={ref}
                        type="button"
                        onClick={toggle}
                        aria-haspopup="menu"
                        aria-expanded={open}
                        aria-controls={open ? id : undefined}
                        title={column.title}
                        className="line-clamp-2 max-w-[72px] rounded px-1 text-center text-[11px] font-semibold leading-tight text-slate-700 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {column.title}
                      </button>
                    )}
                  />
                  <span className="text-[10px] font-normal tabular-nums text-slate-400">{formatNumericDate(column.date).slice(0, 5)}</span>
                </div>
              </th>
            ))}
            <th scope="col" className="sticky right-0 z-10 min-w-[84px] border-b border-l border-slate-200 bg-white px-3 pb-3 text-center align-bottom font-semibold dark:border-slate-700 dark:bg-slate-800">
              O'rtacha
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const name = fullName(row.student)
            return (
              <tr key={row.student.id} className="group">
                <td className={cn(stickyCell, 'border-b border-slate-100 px-4 py-1.5 group-hover:bg-slate-50 sm:px-5 dark:border-slate-700/60 dark:group-hover:bg-slate-700')}>
                  <button
                    type="button"
                    onClick={() => openDrawer({ type: 'student', studentId: row.student.id })}
                    className="flex min-w-0 items-center gap-2.5 text-left"
                  >
                    <span className="w-5 shrink-0 text-right text-xs tabular-nums text-slate-400">{rowIndex + 1}</span>
                    <Avatar name={name} color={row.student.color} size="xs" />
                    <span className="truncate font-medium text-slate-800 hover:text-blue-600 dark:text-slate-100">{name}</span>
                    {row.student.status !== 'active' && row.student.status !== 'graduated' ? (
                      <span className="shrink-0 rounded bg-slate-100 px-1 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">chiqqan</span>
                    ) : null}
                  </button>
                </td>
                {columns.map((column, colIndex) => (
                  <td key={column.id} className="border-b border-slate-100 px-1 py-1.5 text-center group-hover:bg-slate-50/70 dark:border-slate-700/60 dark:group-hover:bg-slate-700/20">
                    <GradeCell
                      value={row.values[colIndex]}
                      row={rowIndex}
                      col={colIndex}
                      editable={column.editable}
                      label={`${name} — ${column.title}`}
                      onCommit={commit(column, row.student.id)}
                    />
                  </td>
                ))}
                <td className="sticky right-0 z-10 border-b border-l border-slate-100 bg-white px-3 py-1.5 text-center group-hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800 dark:group-hover:bg-slate-700">
                  <ScoreBadge value={row.average} />
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            <td className={cn(stickyCell, 'px-4 py-3 sm:px-5')}>Ustun o'rtachasi</td>
            {columnAverages.map((value, index) => (
              <td key={columns[index].id} className="px-1 py-3 text-center tabular-nums">
                {value === null ? '—' : value.toFixed(1)}
              </td>
            ))}
            <td className="sticky right-0 z-10 border-l border-slate-100 bg-white px-3 py-3 dark:border-slate-700/60 dark:bg-slate-800" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
