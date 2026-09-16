import type { AttendanceStatus, DateKey, ExtraLesson, LessonAttendance } from '../types'
import { extraIdFromKey, isExtraKey } from './lessons'

export interface AttendanceSummary {
  present: number
  late: number
  absent: number
  excused: number
  /** Belgilangan o'quvchilar soni */
  total: number
  homeworkDone: number
  homeworkChecked: number
}

export const emptySummary = (): AttendanceSummary => ({
  present: 0,
  late: 0,
  absent: 0,
  excused: 0,
  total: 0,
  homeworkDone: 0,
  homeworkChecked: 0,
})

export function addMark(summary: AttendanceSummary, status: AttendanceStatus, homework?: boolean): void {
  summary[status] += 1
  summary.total += 1
  if (homework !== undefined) {
    summary.homeworkChecked += 1
    if (homework) summary.homeworkDone += 1
  }
}

export function summarize(record: LessonAttendance | undefined, onlyIds?: Set<string>): AttendanceSummary {
  const summary = emptySummary()
  if (!record) return summary
  for (const [studentId, mark] of Object.entries(record)) {
    if (onlyIds && !onlyIds.has(studentId)) continue
    addMark(summary, mark.status, mark.homework)
  }
  return summary
}

export function mergeSummary(target: AttendanceSummary, source: AttendanceSummary): AttendanceSummary {
  target.present += source.present
  target.late += source.late
  target.absent += source.absent
  target.excused += source.excused
  target.total += source.total
  target.homeworkDone += source.homeworkDone
  target.homeworkChecked += source.homeworkChecked
  return target
}

/**
 * Davomat foizi: kelgan (kechikkanlar ham) / (belgilanganlar − sababli).
 * Sababli qoldirilgan darslar o'quvchi foiziga salbiy ta'sir qilmaydi.
 */
export function attendanceRate(summary: AttendanceSummary): number | null {
  const base = summary.total - summary.excused
  if (base <= 0) return summary.total > 0 ? 100 : null
  return ((summary.present + summary.late) / base) * 100
}

export function homeworkRate(summary: AttendanceSummary): number | null {
  if (summary.homeworkChecked === 0) return null
  return (summary.homeworkDone / summary.homeworkChecked) * 100
}

/** Davomat kalitidan guruh va sanani ajratib oladi */
export function lessonKeyInfo(key: string, extras: ExtraLesson[]): { groupId: string; date: DateKey } | null {
  if (isExtraKey(key)) {
    const extra = extras.find((item) => item.id === extraIdFromKey(key))
    return extra ? { groupId: extra.groupId, date: extra.date } : null
  }
  const [groupId, date] = key.split('|')
  return groupId && date ? { groupId, date } : null
}
