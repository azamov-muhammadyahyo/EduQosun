import { useMemo } from 'react'
import type { LessonAttendance, Lesson, Student } from '../../types'
import { rateTone } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { dayOfMonth, formatDateWithWeekday, weekdayShort } from '../../lib/date'
import { attendanceRate, emptySummary, addMark } from '../../domain/attendance'
import { isEnrolledOn, fullName } from '../../domain/students'
import { setAttendanceStatus } from '../../store/actions/attendance'
import { Avatar } from '../ui/Avatar'
import { attendanceMeta, nextStatus } from './attendanceMeta'

interface MonthlyJournalProps {
  students: Student[]
  lessons: Lesson[]
  attendance: Record<string, LessonAttendance>
  today: string
  onOpenLesson: (lesson: Lesson) => void
}

const rateText = {
  green: 'text-emerald-600 dark:text-emerald-400',
  blue: 'text-blue-600 dark:text-blue-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  slate: 'text-slate-400',
} as const

/** Oylik davomat jurnali: katakni bosish holatni almashtiradi (+ → K → – → S → bo'sh) */
export function MonthlyJournal({ students, lessons, attendance, today, onOpenLesson }: MonthlyJournalProps) {
  const rates = useMemo(() => {
    const map = new Map<string, number | null>()
    for (const student of students) {
      const summary = emptySummary()
      for (const lesson of lessons) {
        const mark = attendance[lesson.key]?.[student.id]
        if (mark) addMark(summary, mark.status, mark.homework)
      }
      map.set(student.id, attendanceRate(summary))
    }
    return map
  }, [students, lessons, attendance])

  const sticky = 'sticky left-0 z-10 bg-white dark:bg-slate-800'

  return (
    <div className="scrollbar-thin -mx-4 overflow-x-auto sm:-mx-5">
      <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs text-slate-500 dark:text-slate-400">
            <th scope="col" className={cn(sticky, 'min-w-[200px] border-b border-slate-200 px-4 pb-2 text-left font-semibold sm:px-5 dark:border-slate-700')}>
              O'quvchi
            </th>
            {lessons.map((lesson) => (
              <th key={lesson.key} scope="col" className="w-10 border-b border-slate-200 px-0.5 pb-2 font-medium dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => onOpenLesson(lesson)}
                  title={`${formatDateWithWeekday(lesson.date)}, ${lesson.start} — yo'qlamani ochish`}
                  className={cn(
                    'mx-auto flex w-9 flex-col items-center rounded-lg py-1 transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10',
                    lesson.date === today && 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
                  )}
                >
                  <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">{dayOfMonth(lesson.date)}</span>
                  <span className="text-[10px]">{weekdayShort(lesson.date)}</span>
                </button>
              </th>
            ))}
            <th scope="col" className="sticky right-0 z-10 border-b border-l border-slate-200 bg-white px-3 pb-2 font-semibold dark:border-slate-700 dark:bg-slate-800">
              Davomat
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const rate = rates.get(student.id) ?? null
            return (
              <tr key={student.id} className="group">
                <td className={cn(sticky, 'border-b border-slate-100 px-4 py-1.5 group-hover:bg-slate-50 sm:px-5 dark:border-slate-700/60 dark:group-hover:bg-slate-700')}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={fullName(student)} color={student.color} size="xs" />
                    <span className="truncate font-medium text-slate-800 dark:text-slate-100">{fullName(student)}</span>
                  </span>
                </td>
                {lessons.map((lesson) => {
                  const mark = attendance[lesson.key]?.[student.id]
                  const enrolled = isEnrolledOn(student, lesson.date)
                  const future = lesson.date > today
                  const meta = mark ? attendanceMeta[mark.status] : null
                  return (
                    <td key={lesson.key} className="border-b border-slate-100 px-0.5 py-1.5 text-center dark:border-slate-700/60">
                      {enrolled ? (
                        <button
                          type="button"
                          disabled={future}
                          onClick={() => setAttendanceStatus(lesson.key, student.id, nextStatus(mark?.status))}
                          title={meta ? meta.label : future ? "Dars hali bo'lmagan" : 'Belgilanmagan — bosing'}
                          aria-label={`${fullName(student)}, ${formatDateWithWeekday(lesson.date)}: ${meta?.label ?? 'belgilanmagan'}`}
                          className={cn(
                            'mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-all disabled:cursor-default',
                            meta ? meta.cell : 'text-slate-300 hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-slate-700',
                            !future && 'hover:scale-110',
                          )}
                        >
                          {meta ? meta.short : future ? '' : '·'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-200 dark:text-slate-700">×</span>
                      )}
                    </td>
                  )
                })}
                <td className="sticky right-0 z-10 border-b border-l border-slate-100 bg-white px-3 py-1.5 text-center group-hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800 dark:group-hover:bg-slate-700">
                  <span className={cn('text-sm font-bold tabular-nums', rateText[rateTone(rate)])}>{rate === null ? '—' : `${Math.round(rate)}%`}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
