import type { Group, GroupStatus } from '../../types'
import { todayKey } from '../../lib/date'
import { createId } from '../../lib/id'
import { getAppState, updateApp } from '../appStore'
import { logActivity } from './feed'

export type GroupInput = Pick<
  Group,
  | 'name'
  | 'course'
  | 'direction'
  | 'subject'
  | 'tagline'
  | 'description'
  | 'color'
  | 'icon'
  | 'room'
  | 'startDate'
  | 'endDate'
  | 'schedule'
>

/** Kurs nomi bosh harflaridan kod: "React JS" → "RJ-010" */
function nextGroupCode(course: string, groups: Group[]): string {
  const letters =
    course
      .split(/[\s/.-]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .replace(/[^A-Z]/g, '')
      .slice(0, 2) || 'GR'
  const serial = groups.length + 1
  return `${letters.padEnd(2, 'X')}-${String(serial).padStart(3, '0')}`
}

/** Yangi guruh uchun boshlang'ich mavzular ro'yxati */
function starterCurriculum(subject: string): string[] {
  return [
    `${subject}: kirish darsi`,
    `${subject} asoslari`,
    "Amaliy mashg'ulot",
    'Mavzuni mustahkamlash',
    'Takrorlash darsi',
    'Nazorat ishi',
  ]
}

export function createGroup(input: GroupInput): Group {
  const groups = getAppState().groups
  const group: Group = {
    ...input,
    id: createId('grp'),
    code: nextGroupCode(input.course, groups),
    status: 'active',
    createdAt: new Date().toISOString(),
    curriculum: starterCurriculum(input.subject),
    schedule: [...input.schedule].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start)),
  }
  updateApp((state) => ({ ...state, groups: [group, ...state.groups] }))
  logActivity('group', `Yangi guruh yaratildi: ${group.name} (${group.course})`)
  return group
}

export function updateGroup(id: string, patch: Partial<GroupInput>): void {
  updateApp((state) => ({
    ...state,
    groups: state.groups.map((group) =>
      group.id === id
        ? {
            ...group,
            ...patch,
            schedule: patch.schedule
              ? [...patch.schedule].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
              : group.schedule,
          }
        : group,
    ),
  }))
}

/**
 * Guruhni yakunlash yoki qayta faollashtirish.
 * Yakunlanganda o'qiyotganlar "bitirgan" bo'ladi, qayta ochilganda — aksincha.
 */
export function setGroupStatus(id: string, status: GroupStatus): void {
  const today = todayKey()
  updateApp((state) => ({
    ...state,
    groups: state.groups.map((group) => {
      if (group.id !== id) return group
      if (status === 'completed') {
        return { ...group, status, endDate: group.endDate && group.endDate < today ? group.endDate : today }
      }
      return { ...group, status, endDate: group.endDate && group.endDate > today ? group.endDate : undefined }
    }),
    students: state.students.map((student) => {
      if (student.groupId !== id) return student
      if (status === 'completed' && student.status === 'active') return { ...student, status: 'graduated' }
      if (status === 'active' && student.status === 'graduated') return { ...student, status: 'active' }
      return student
    }),
  }))
  const group = getAppState().groups.find((item) => item.id === id)
  if (group) {
    logActivity('group', status === 'completed' ? `${group.name} guruhi yakunlandi` : `${group.name} guruhi qayta faollashtirildi`)
  }
}

/** Guruhni va unga tegishli barcha ma'lumotlarni o'chiradi */
export function deleteGroup(id: string): void {
  updateApp((state) => {
    const studentIds = new Set(state.students.filter((s) => s.groupId === id).map((s) => s.id))
    const assignmentIds = new Set(state.assignments.filter((a) => a.groupId === id).map((a) => a.id))
    const assessmentIds = new Set(state.assessments.filter((a) => a.groupId === id).map((a) => a.id))
    const extraIds = new Set(state.extraLessons.filter((x) => x.groupId === id).map((x) => x.id))

    const attendance = Object.fromEntries(
      Object.entries(state.attendance).filter(([key]) => {
        if (key.startsWith(`${id}|`)) return false
        return !(key.startsWith('x|') && extraIds.has(key.slice(2)))
      }),
    )
    const overrides = Object.fromEntries(Object.entries(state.lessonOverrides).filter(([key]) => !key.startsWith(`${id}|`)))

    return {
      ...state,
      groups: state.groups.filter((g) => g.id !== id),
      students: state.students.filter((s) => s.groupId !== id),
      assignments: state.assignments.filter((a) => a.groupId !== id),
      submissions: Object.fromEntries(Object.entries(state.submissions).filter(([key]) => !assignmentIds.has(key))),
      assessments: state.assessments.filter((a) => a.groupId !== id),
      grades: Object.fromEntries(Object.entries(state.grades).filter(([key]) => !assessmentIds.has(key))),
      tests: state.tests.filter((t) => t.groupId !== id),
      extraLessons: state.extraLessons.filter((x) => x.groupId !== id),
      lessonOverrides: overrides,
      attendance,
      conversations: state.conversations.filter(
        (c) => c.groupId !== id && !(c.studentId && studentIds.has(c.studentId)),
      ),
      reminders: state.reminders.map((r) => (r.groupId === id ? { ...r, groupId: undefined } : r)),
    }
  })
}
