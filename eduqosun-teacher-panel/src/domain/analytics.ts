import type {
  Assessment,
  Assignment,
  DateKey,
  ExtraLesson,
  Group,
  LessonAttendance,
  Student,
  Submission,
  Test,
} from '../types'
import { average } from '../lib/format'
import {
  addMark,
  attendanceRate,
  emptySummary,
  homeworkRate,
  lessonKeyInfo,
  mergeSummary,
  summarize,
  type AttendanceSummary,
} from './attendance'
import { assignmentRoster, isPastDue, toTenScale } from './assignments'
import { resultPercent } from './tests'

/* ———————————————————— O'quvchi ko'rsatkichlari ———————————————————— */

export interface StudentMetrics {
  attendance: AttendanceSummary
  attendanceRate: number | null
  homeworkRate: number | null
  gradeAverage: number | null
  gradeCount: number
  assignmentsDone: number
  assignmentsTotal: number
  testAverage: number | null
  /** Umumiy reyting (0–100): davomat, baho va topshiriqlar asosida */
  score: number | null
  atRisk: boolean
  riskReasons: string[]
}

export interface MetricsInput {
  students: Student[]
  attendance: Record<string, LessonAttendance>
  extras: ExtraLesson[]
  assessments: Assessment[]
  grades: Record<string, Record<string, number>>
  assignments: Assignment[]
  submissions: Record<string, Record<string, Submission>>
  tests: Test[]
  now: Date
}

/** Xavf chegaralari — "E'tibor talab qiladi" ro'yxati uchun */
export const RISK_THRESHOLDS = { attendance: 75, grade: 6, assignments: 50 } as const

export function buildStudentMetrics(input: MetricsInput): Map<string, StudentMetrics> {
  const attendance = new Map<string, AttendanceSummary>()
  const grades = new Map<string, number[]>()
  const testScores = new Map<string, number[]>()
  const assignmentsDone = new Map<string, number>()
  const assignmentsTotal = new Map<string, number>()

  const push = (map: Map<string, number[]>, id: string, value: number) => {
    const list = map.get(id)
    if (list) list.push(value)
    else map.set(id, [value])
  }
  const inc = (map: Map<string, number>, id: string) => map.set(id, (map.get(id) ?? 0) + 1)

  for (const record of Object.values(input.attendance)) {
    for (const [studentId, mark] of Object.entries(record)) {
      let summary = attendance.get(studentId)
      if (!summary) {
        summary = emptySummary()
        attendance.set(studentId, summary)
      }
      addMark(summary, mark.status, mark.homework)
    }
  }

  for (const assessment of input.assessments) {
    const record = input.grades[assessment.id]
    if (!record) continue
    for (const [studentId, value] of Object.entries(record)) push(grades, studentId, value)
  }

  for (const assignment of input.assignments) {
    const submissions = input.submissions[assignment.id] ?? {}
    const due = isPastDue(assignment, input.now)
    for (const student of assignmentRoster(assignment, input.students)) {
      const submission = submissions[student.id]
      if (due || submission) inc(assignmentsTotal, student.id)
      if (submission) inc(assignmentsDone, student.id)
      if (submission?.score !== undefined) {
        push(grades, student.id, toTenScale(submission.score, assignment.maxScore))
      }
    }
  }

  for (const test of input.tests) {
    for (const result of test.results) {
      const value = resultPercent(test, result)
      push(testScores, result.studentId, value)
      push(grades, result.studentId, value / 10)
    }
  }

  const metrics = new Map<string, StudentMetrics>()
  for (const student of input.students) {
    const summary = attendance.get(student.id) ?? emptySummary()
    const studentGrades = grades.get(student.id) ?? []
    const done = assignmentsDone.get(student.id) ?? 0
    const total = assignmentsTotal.get(student.id) ?? 0
    const rate = attendanceRate(summary)
    const gradeAverage = average(studentGrades)
    const completion = total > 0 ? (done / total) * 100 : null

    const reasons: string[] = []
    if (student.status === 'active') {
      if (rate !== null && summary.total >= 4 && rate < RISK_THRESHOLDS.attendance) {
        reasons.push(`Davomat ${Math.round(rate)}%`)
      }
      if (gradeAverage !== null && studentGrades.length >= 3 && gradeAverage < RISK_THRESHOLDS.grade) {
        reasons.push(`O'rtacha baho ${gradeAverage.toFixed(1)}`)
      }
      if (completion !== null && total >= 2 && completion < RISK_THRESHOLDS.assignments) {
        reasons.push(`Topshiriqlar ${done}/${total}`)
      }
    }

    const parts: number[] = []
    if (rate !== null) parts.push(rate)
    if (gradeAverage !== null) parts.push(gradeAverage * 10)
    if (completion !== null) parts.push(completion)

    metrics.set(student.id, {
      attendance: summary,
      attendanceRate: rate,
      homeworkRate: homeworkRate(summary),
      gradeAverage,
      gradeCount: studentGrades.length,
      assignmentsDone: done,
      assignmentsTotal: total,
      testAverage: average(testScores.get(student.id) ?? []),
      score: average(parts),
      atRisk: reasons.length > 0,
      riskReasons: reasons,
    })
  }
  return metrics
}

/* ———————————————————— Guruh ko'rsatkichlari ———————————————————— */

export interface GroupMetrics {
  attendance: AttendanceSummary
  attendanceRate: number | null
  homeworkRate: number | null
  gradeAverage: number | null
  atRiskCount: number
  /** Davomati olingan darslar soni */
  markedLessons: number
}

export function buildGroupMetrics(
  groups: Group[],
  students: Student[],
  studentMetrics: Map<string, StudentMetrics>,
  attendance: Record<string, LessonAttendance>,
  extras: ExtraLesson[],
): Map<string, GroupMetrics> {
  const summaries = new Map<string, AttendanceSummary>()
  const lessonCounts = new Map<string, number>()

  for (const [key, record] of Object.entries(attendance)) {
    const info = lessonKeyInfo(key, extras)
    if (!info) continue
    const summary = summaries.get(info.groupId) ?? emptySummary()
    mergeSummary(summary, summarize(record))
    summaries.set(info.groupId, summary)
    lessonCounts.set(info.groupId, (lessonCounts.get(info.groupId) ?? 0) + 1)
  }

  const result = new Map<string, GroupMetrics>()
  for (const group of groups) {
    const members = students.filter(
      (s) => s.groupId === group.id && (s.status === 'active' || s.status === 'graduated'),
    )
    const gradeValues = members
      .map((s) => studentMetrics.get(s.id)?.gradeAverage)
      .filter((value): value is number => value !== null && value !== undefined)
    const summary = summaries.get(group.id) ?? emptySummary()
    result.set(group.id, {
      attendance: summary,
      attendanceRate: attendanceRate(summary),
      homeworkRate: homeworkRate(summary),
      gradeAverage: average(gradeValues),
      atRiskCount: members.filter((s) => studentMetrics.get(s.id)?.atRisk).length,
      markedLessons: lessonCounts.get(group.id) ?? 0,
    })
  }
  return result
}

/* ———————————————————— Vaqt bo'yicha davomat ———————————————————— */

export interface AttendanceBucket {
  label: string
  from: DateKey
  to: DateKey
  summary: AttendanceSummary
  rate: number | null
  homeworkRate: number | null
}

/**
 * Davomatni sanalar oralig'i bo'yicha guruhlaydi.
 * `groupIds` berilsa — faqat shu guruhlar hisobga olinadi.
 */
export function attendanceByRanges(
  ranges: { label: string; from: DateKey; to: DateKey }[],
  attendance: Record<string, LessonAttendance>,
  extras: ExtraLesson[],
  groupIds?: Set<string>,
): AttendanceBucket[] {
  const buckets = ranges.map((range) => ({ ...range, summary: emptySummary() }))
  for (const [key, record] of Object.entries(attendance)) {
    const info = lessonKeyInfo(key, extras)
    if (!info) continue
    if (groupIds && !groupIds.has(info.groupId)) continue
    const bucket = buckets.find((b) => info.date >= b.from && info.date <= b.to)
    if (bucket) mergeSummary(bucket.summary, summarize(record))
  }
  return buckets.map((bucket) => ({
    ...bucket,
    rate: attendanceRate(bucket.summary),
    homeworkRate: homeworkRate(bucket.summary),
  }))
}
