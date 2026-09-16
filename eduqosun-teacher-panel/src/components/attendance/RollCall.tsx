import { memo } from 'react'
import { Check, Minus, X } from 'lucide-react'
import type { AttendanceMark, AttendanceStatus, Student } from '../../types'
import { cn } from '../../lib/cn'
import { fullName } from '../../domain/students'
import { setAttendanceStatus, setHomework } from '../../store/actions/attendance'
import { openDrawer } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { attendanceMeta, attendanceStatuses } from './attendanceMeta'

interface RollCallRowProps {
  index: number
  student: Student
  mark: AttendanceMark | undefined
  lessonKey: string
  disabled: boolean
  attendanceRate: number | null
}

/** Uy vazifasi: bajardi → bajarmadi → belgilanmagan */
function nextHomework(value: boolean | undefined): boolean | undefined {
  if (value === undefined) return true
  if (value) return false
  return undefined
}

const RollCallRow = memo(function RollCallRow({ index, student, mark, lessonKey, disabled, attendanceRate }: RollCallRowProps) {
  const name = fullName(student)
  const present = mark?.status === 'present' || mark?.status === 'late'
  const homework = mark?.homework

  const choose = (status: AttendanceStatus) => setAttendanceStatus(lessonKey, student.id, mark?.status === status ? null : status)

  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-xl border px-3 py-2.5 transition-colors sm:flex-row sm:items-center',
        mark ? 'border-slate-200/80 bg-white dark:border-slate-700/60 dark:bg-slate-800' : 'border-dashed border-slate-300 bg-slate-50/60 dark:border-slate-600 dark:bg-slate-900/30',
      )}
    >
      <button
        type="button"
        onClick={() => openDrawer({ type: 'student', studentId: student.id })}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="w-5 shrink-0 text-right text-xs tabular-nums text-slate-400">{index}</span>
        <Avatar name={name} color={student.color} size="sm" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-800 hover:text-blue-600 dark:text-slate-100">{name}</span>
          <span className="block text-xs text-slate-400">
            Umumiy davomat: {attendanceRate === null ? '—' : `${Math.round(attendanceRate)}%`}
          </span>
        </span>
      </button>

      <div className="flex flex-wrap items-center gap-2 pl-8 sm:pl-0">
        <div role="radiogroup" aria-label={`${name} — davomat`} className="flex gap-1">
          {attendanceStatuses.map((status) => {
            const meta = attendanceMeta[status]
            const Icon = meta.icon
            const active = mark?.status === status
            return (
              <button
                key={status}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => choose(status)}
                title={meta.label}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40',
                  active
                    ? meta.active
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden min-[1500px]:inline">{meta.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={disabled || !present}
          onClick={() => setHomework(lessonKey, student.id, nextHomework(homework))}
          title="Uy vazifasi (bosib o'zgartiring)"
          aria-label={`Uy vazifasi: ${homework === undefined ? 'belgilanmagan' : homework ? 'bajardi' : 'bajarmadi'}`}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30',
            homework === true && 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
            homework === false && 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
            homework === undefined && 'border-slate-200 text-slate-400 dark:border-slate-700',
          )}
        >
          {homework === true ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : homework === false ? <X className="h-3.5 w-3.5" aria-hidden="true" /> : <Minus className="h-3.5 w-3.5" aria-hidden="true" />}
          Vazifa
        </button>
      </div>
    </li>
  )
})

interface RollCallProps {
  roster: Student[]
  record: Record<string, AttendanceMark> | undefined
  lessonKey: string
  disabled: boolean
  rates: Map<string, number | null>
}

/** Yo'qlama ro'yxati */
export function RollCall({ roster, record, lessonKey, disabled, rates }: RollCallProps) {
  return (
    <ul className="space-y-2">
      {roster.map((student, index) => (
        <RollCallRow
          key={student.id}
          index={index + 1}
          student={student}
          mark={record?.[student.id]}
          lessonKey={lessonKey}
          disabled={disabled}
          attendanceRate={rates.get(student.id) ?? null}
        />
      ))}
    </ul>
  )
}
