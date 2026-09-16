import type { Assignment, DateKey, Group, Student, Submission } from '../types'
import { MONTHS_SHORT, addDays, addMonths, endOfMonth, formatDayMonth, parseDateKey } from '../lib/date'
import { average } from '../lib/format'
import { assignmentProgress, assignmentRoster, isPastDue } from './assignments'
import { gradeColumns, gradeFor, type GradeInputs } from './grades'

/*
 * Statistika sahifasi uchun davrlar va vaqt bo'yicha agregatlar.
 */

export type StatsPeriod = '30' | '90' | '180'

export interface DateBucket {
  label: string
  from: DateKey
  to: DateKey
}

/** 30 kun → 6 ta 5 kunlik, 90 kun → 13 hafta, 180 kun → 6 oy */
export function periodBuckets(period: StatsPeriod, today: DateKey): DateBucket[] {
  if (period === '180') {
    return Array.from({ length: 6 }, (_, i) => {
      const from = addMonths(today, i - 5)
      const to = i === 5 ? today : endOfMonth(from)
      return { label: MONTHS_SHORT[parseDateKey(from).getMonth()], from, to }
    })
  }
  const size = period === '30' ? 5 : 7
  const count = period === '30' ? 6 : 13
  return Array.from({ length: count }, (_, i) => {
    const to = addDays(today, -(count - 1 - i) * size)
    const from = addDays(to, -size + 1)
    return { label: formatDayMonth(to).replace('-', ' '), from, to }
  })
}

export function periodRange(period: StatsPeriod, today: DateKey): { from: DateKey; to: DateKey; prevFrom: DateKey; prevTo: DateKey } {
  const days = Number(period)
  const from = addDays(today, -days + 1)
  return { from, to: today, prevFrom: addDays(from, -days), prevTo: addDays(from, -1) }
}

export interface GradeEntry {
  groupId: string
  studentId: string
  date: DateKey
  value: number
}

/** Barcha manbalardagi baholarni sanasi bilan tekis ro'yxatga yig'adi */
export function collectGradeEntries(groups: Group[], students: Student[], inputs: GradeInputs): GradeEntry[] {
  const entries: GradeEntry[] = []
  for (const group of groups) {
    const members = students.filter((s) => s.groupId === group.id)
    for (const column of gradeColumns(group.id, inputs)) {
      for (const student of members) {
        const value = gradeFor(column, student.id, inputs)
        if (value !== null) entries.push({ groupId: group.id, studentId: student.id, date: column.date, value })
      }
    }
  }
  return entries
}

export function averageGrade(entries: GradeEntry[], from: DateKey, to: DateKey, groupId?: string): number | null {
  return average(entries.filter((e) => e.date >= from && e.date <= to && (!groupId || e.groupId === groupId)).map((e) => e.value))
}

/** Muddati shu davrda tugagan topshiriqlarni topshirish ulushi (%) */
export function completionRate(
  assignments: Assignment[],
  submissions: Record<string, Record<string, Submission>>,
  students: Student[],
  from: DateKey,
  to: DateKey,
  now: Date,
  groupId?: string,
): number | null {
  let total = 0
  let submitted = 0
  for (const assignment of assignments) {
    if (assignment.dueDate < from || assignment.dueDate > to || !isPastDue(assignment, now)) continue
    if (groupId && assignment.groupId !== groupId) continue
    const progress = assignmentProgress(assignment, assignmentRoster(assignment, students), submissions[assignment.id])
    total += progress.total
    submitted += progress.submitted
  }
  return total > 0 ? (submitted / total) * 100 : null
}

/** Ikki qiymat farqi (butun), biri yo'q bo'lsa null */
export function delta(current: number | null, previous: number | null, digits = 0): number | null {
  if (current === null || previous === null) return null
  const factor = 10 ** digits
  return Math.round((current - previous) * factor) / factor
}
