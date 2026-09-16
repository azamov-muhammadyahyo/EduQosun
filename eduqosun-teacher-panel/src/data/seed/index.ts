import type { ExtraLesson, Student } from '../../types'
import { STATE_VERSION, defaultSettings, type AppState } from '../../store/appState'
import { addDays, toDateKey, weekdayOf } from '../../lib/date'
import { createRandom } from '../../lib/random'
import { buildGroupMetrics, buildStudentMetrics } from '../../domain/analytics'
import { buildAttendance, buildGrades } from './academics'
import { buildAssignments } from './assignments'
import { buildActivity, buildConversations, buildNotifications, buildReminders } from './communication'
import { buildGroup, groupBlueprints } from './groups'
import { buildStudents } from './students'
import { buildTests } from './tests'

/**
 * Demo holatni yaratadi. Barcha sanalar `now`ga nisbatan hisoblanadi,
 * shuning uchun ilova istalgan kuni ochilganda ham "jonli" ko'rinadi.
 */
export function createSeedState(now: Date = new Date()): AppState {
  const today = toDateKey(now)
  const random = createRandom(20250512)

  const groups = groupBlueprints.map((blueprint) => buildGroup(blueprint, today))
  const seededStudents = buildStudents(groupBlueprints, groups, today, random)
  const attendance = buildAttendance(groups, seededStudents, today, now, random)
  const { assessments, grades } = buildGrades(groups, seededStudents, today, random)
  const { assignments, submissions } = buildAssignments(seededStudents, today, now, random)
  const tests = buildTests(seededStudents, today, random)

  const students: Student[] = seededStudents.map(({ diligence, ...student }) => {
    void diligence
    return student
  })

  // Shu haftaning shanbasida 10-A uchun qo'shimcha mashg'ulot
  const saturday = addDays(today, 6 - weekdayOf(today) >= 0 ? 6 - weekdayOf(today) : 6)
  const extraLessons: ExtraLesson[] = [
    {
      id: 'x1',
      groupId: 'g3',
      date: saturday,
      start: '11:00',
      end: '12:30',
      topic: "Qo'shimcha mashg'ulot: masalalar yechish",
      kind: 'practice',
      room: 'Kompyuter xonasi 1',
      notes: "Nazorat ishidan past ball olganlar uchun takrorlash darsi.",
      homework: '',
      canceled: false,
    },
  ]

  // Bildirishnoma uchun eng past davomatli guruhni aniqlaymiz
  const metrics = buildStudentMetrics({
    students,
    attendance,
    extras: extraLessons,
    assessments,
    grades,
    assignments,
    submissions,
    tests,
    now,
  })
  const groupMetrics = buildGroupMetrics(groups, students, metrics, attendance, extraLessons)
  const weakest = groups
    .filter((group) => group.status === 'active')
    .map((group) => ({ group: group.name, rate: groupMetrics.get(group.id)?.attendanceRate ?? 100 }))
    .sort((a, b) => a.rate - b.rate)[0]

  return {
    version: STATE_VERSION,
    seededOn: today,
    profile: {
      firstName: 'Sardor',
      lastName: 'Azamatov',
      phone: '+998 90 123 45 67',
      email: 'sardor.azamatov@eduqosun.uz',
      bio: "6 yillik tajribaga ega dasturlash o'qituvchisi. Frontend va Python yo'nalishlarida dars beraman.",
      subjects: ['JavaScript', 'Python', 'React', 'UI/UX'],
      experienceYears: 6,
      color: 'blue',
      centerName: "EduQosun o'quv markazi",
    },
    settings: { ...defaultSettings },
    session: {
      loggedIn: true,
      login: '+998 90 123 45 67',
      passwordHash: '',
      lastLoginAt: now.toISOString(),
    },
    groups,
    students,
    lessonOverrides: {},
    extraLessons,
    attendance,
    assessments,
    grades,
    assignments,
    submissions,
    tests,
    conversations: buildConversations(students, groups, today, now),
    reminders: buildReminders(today, now),
    notifications: buildNotifications(
      now,
      weakest && weakest.rate < 90 ? { group: weakest.group, rate: Math.round(weakest.rate) } : undefined,
    ),
    activity: buildActivity(now),
  }
}
