import type { Assignment, DateKey, Student, Submission } from '../types'
import { dateKeyOfIso, diffDays, isoAt } from '../lib/date'
import { isEnrolledOn } from './students'

export function dueIso(assignment: Pick<Assignment, 'dueDate' | 'dueTime'>): string {
  return isoAt(assignment.dueDate, assignment.dueTime)
}

export function isPastDue(assignment: Assignment, now: Date): boolean {
  return new Date(dueIso(assignment)).getTime() < now.getTime()
}

export function isLateSubmission(assignment: Assignment, submission: Submission): boolean {
  return new Date(submission.submittedAt).getTime() > new Date(dueIso(assignment)).getTime()
}

/** Topshiriq kimlarga berilgan: topshiriq e'lon qilingan kuni guruhda bo'lgan o'quvchilar */
export function assignmentRoster(assignment: Assignment, students: Student[]): Student[] {
  const givenOn = dateKeyOfIso(assignment.createdAt)
  return students.filter((s) => s.groupId === assignment.groupId && isEnrolledOn(s, givenOn))
}

export interface AssignmentProgress {
  total: number
  submitted: number
  graded: number
  /** Topshirilgan, lekin hali baholanmagan */
  pending: number
  late: number
  missing: number
  averageScore: number | null
}

export function assignmentProgress(
  assignment: Assignment,
  roster: Student[],
  submissions: Record<string, Submission> | undefined,
): AssignmentProgress {
  const result: AssignmentProgress = {
    total: roster.length,
    submitted: 0,
    graded: 0,
    pending: 0,
    late: 0,
    missing: 0,
    averageScore: null,
  }
  let scoreSum = 0
  for (const student of roster) {
    const submission = submissions?.[student.id]
    if (!submission) {
      result.missing += 1
      continue
    }
    result.submitted += 1
    if (isLateSubmission(assignment, submission)) result.late += 1
    if (submission.score === undefined) {
      result.pending += 1
    } else {
      result.graded += 1
      scoreSum += submission.score
    }
  }
  if (result.graded > 0) result.averageScore = scoreSum / result.graded
  return result
}

/** "2 kun qoldi" | "Bugun" | "3 kun o'tdi" */
export function dueLabel(dueDate: DateKey, today: DateKey): { text: string; tone: 'danger' | 'warning' | 'normal' } {
  const diff = diffDays(dueDate, today)
  if (diff < 0) return { text: `Muddati ${-diff} kun oldin tugagan`, tone: 'danger' }
  if (diff === 0) return { text: 'Muddat: bugun', tone: 'warning' }
  if (diff === 1) return { text: 'Muddat: ertaga', tone: 'warning' }
  return { text: `${diff} kun qoldi`, tone: 'normal' }
}

/** Topshiriq balini 10 ballik shkalaga o'tkazadi */
export function toTenScale(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0
  return (score / maxScore) * 10
}
