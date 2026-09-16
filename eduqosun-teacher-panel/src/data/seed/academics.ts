import type { Assessment, AssessmentType, AttendanceStatus, DateKey, Group, LessonAttendance } from '../../types'
import type { Random } from '../../lib/random'
import { addDays, minutesOfDay, toMinutes } from '../../lib/date'
import { clamp } from '../../lib/format'
import { lessonsOnDate } from '../../domain/lessons'
import { isEnrolledOn } from '../../domain/students'
import type { SeededStudent } from './students'

/** Davomat tarixi necha kunlik yaratiladi */
const HISTORY_DAYS = 63

function pickStatus(diligence: number, random: Random): AttendanceStatus {
  const roll = random.next()
  const presentChance = Math.min(0.985, diligence * 0.9 + 0.12)
  if (roll < presentChance) return random.chance(0.07) ? 'late' : 'present'
  if (roll < presentChance + 0.02) return 'excused'
  return 'absent'
}

/**
 * O'tgan darslar davomati (+ uy vazifasi belgisi).
 * Bugungi darslardan faqat tugab bo'lganlari belgilanadi — qolganini o'qituvchi o'zi belgilaydi.
 */
export function buildAttendance(
  groups: Group[],
  students: SeededStudent[],
  today: DateKey,
  now: Date,
  random: Random,
): Record<string, LessonAttendance> {
  const result: Record<string, LessonAttendance> = {}
  const nowMinutes = minutesOfDay(now)

  for (const group of groups) {
    const lastDay = group.endDate && group.endDate < today ? group.endDate : today
    const fromCandidate = addDays(lastDay, -HISTORY_DAYS)
    const from = fromCandidate > group.startDate ? fromCandidate : group.startDate
    const members = students.filter((s) => s.groupId === group.id)

    for (let date = from; date <= lastDay; date = addDays(date, 1)) {
      const lessons = lessonsOnDate(date, { groups: [group], overrides: {}, extras: [] })
      for (const lesson of lessons) {
        if (date === today && toMinutes(lesson.end) > nowMinutes) continue
        const record: LessonAttendance = {}
        for (const student of members) {
          if (!isEnrolledOn(student, date)) continue
          const status = pickStatus(student.diligence, random)
          const present = status === 'present' || status === 'late'
          record[student.id] = present
            ? { status, homework: random.chance(Math.min(0.97, student.diligence * 0.95)) }
            : { status }
        }
        if (Object.keys(record).length > 0) result[lesson.key] = record
      }
    }
  }
  return result
}

interface AssessmentPlan {
  weeksAgo: number
  title: string
  type: AssessmentType
}

const assessmentPlan: AssessmentPlan[] = [
  { weeksAgo: 5, title: 'Darsdagi faollik', type: 'classwork' },
  { weeksAgo: 4, title: "Og'zaki so'rov", type: 'oral' },
  { weeksAgo: 3, title: 'Nazorat ishi 1', type: 'quiz' },
  { weeksAgo: 2, title: "Amaliy mashg'ulot", type: 'classwork' },
  { weeksAgo: 1, title: 'Nazorat ishi 2', type: 'quiz' },
]

/** Baholash ustunlari va baholar */
export function buildGrades(
  groups: Group[],
  students: SeededStudent[],
  today: DateKey,
  random: Random,
): { assessments: Assessment[]; grades: Record<string, Record<string, number>> } {
  const assessments: Assessment[] = []
  const grades: Record<string, Record<string, number>> = {}
  let serial = 0

  for (const group of groups) {
    const lastDay = group.endDate && group.endDate < today ? group.endDate : addDays(today, -1)
    const members = students.filter((s) => s.groupId === group.id)

    for (const plan of assessmentPlan) {
      // Rejadagi sanaga eng yaqin (undan oldingi) dars kunini topamiz
      let date = addDays(lastDay, -(plan.weeksAgo - 1) * 7)
      let found: DateKey | null = null
      for (let step = 0; step < 7; step += 1) {
        const candidate = addDays(date, -step)
        if (lessonsOnDate(candidate, { groups: [group], overrides: {}, extras: [] }).length > 0) {
          found = candidate
          break
        }
      }
      if (!found || found < addDays(group.startDate, 3)) continue
      date = found

      serial += 1
      const assessment: Assessment = {
        id: `as${serial}`,
        groupId: group.id,
        title: plan.title,
        type: plan.type,
        date,
      }
      assessments.push(assessment)

      const record: Record<string, number> = {}
      for (const student of members) {
        if (!isEnrolledOn(student, date) || random.chance(0.07)) continue
        const spread = plan.type === 'quiz' ? 1.3 : 0.9
        record[student.id] = clamp(Math.round(random.normal(2.6 + student.diligence * 7.4, spread)), 2, 10)
      }
      grades[assessment.id] = record
    }
  }

  return { assessments, grades }
}
