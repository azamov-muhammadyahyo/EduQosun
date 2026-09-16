import type { Student } from '../../types'
import { accentPalette } from '../../lib/colors'
import { todayKey } from '../../lib/date'
import { formatPhone } from '../../lib/format'
import { createId } from '../../lib/id'
import { omitNested } from '../../lib/object'
import { liveRandom } from '../../lib/random'
import { fullName } from '../../domain/students'
import { getAppState, updateApp } from '../appStore'
import { logActivity } from './feed'

export type StudentInput = Pick<
  Student,
  'firstName' | 'lastName' | 'gender' | 'groupId' | 'phone' | 'parentName' | 'parentPhone' | 'birthDate' | 'joinedAt' | 'note'
>

function normalize(input: Partial<StudentInput>): Partial<StudentInput> {
  return {
    ...input,
    ...(input.firstName !== undefined && { firstName: input.firstName.trim() }),
    ...(input.lastName !== undefined && { lastName: input.lastName.trim() }),
    ...(input.phone !== undefined && { phone: formatPhone(input.phone) }),
    ...(input.parentPhone !== undefined && { parentPhone: input.parentPhone ? formatPhone(input.parentPhone) : '' }),
    ...(input.parentName !== undefined && { parentName: input.parentName.trim() }),
  }
}

function groupName(groupId: string): string {
  return getAppState().groups.find((g) => g.id === groupId)?.name ?? ''
}

export function createStudent(input: StudentInput): Student {
  const student: Student = {
    ...(normalize(input) as StudentInput),
    id: createId('std'),
    status: 'active',
    color: liveRandom.pick(accentPalette),
  }
  updateApp((state) => ({ ...state, students: [...state.students, student] }))
  logActivity('student', `Yangi o'quvchi qo'shildi (${groupName(student.groupId)})`, fullName(student))
  return student
}

export function updateStudent(id: string, patch: Partial<StudentInput>): void {
  const clean = normalize(patch)
  updateApp((state) => ({
    ...state,
    students: state.students.map((s) => (s.id === id ? { ...s, ...clean } : s)),
  }))
}

export function setStudentNote(id: string, note: string): void {
  updateApp((state) => ({
    ...state,
    students: state.students.map((s) => (s.id === id ? { ...s, note } : s)),
  }))
}

/** O'quvchini guruhdan chiqarish (ma'lumotlari tarix uchun saqlanadi) */
export function removeFromGroup(id: string): void {
  const today = todayKey()
  updateApp((state) => ({
    ...state,
    students: state.students.map((s) => (s.id === id ? { ...s, status: 'left', leftAt: today } : s)),
  }))
  const student = getAppState().students.find((s) => s.id === id)
  if (student) logActivity('student', `guruhdan chiqarildi (${groupName(student.groupId)})`, fullName(student))
}

/** Chiqqan o'quvchini guruhga qaytarish */
export function restoreStudent(id: string): void {
  updateApp((state) => ({
    ...state,
    students: state.students.map((s) =>
      s.id === id && s.status === 'left' ? { ...s, status: 'active', leftAt: undefined } : s,
    ),
  }))
}

/**
 * Boshqa guruhga o'tkazish: eski yozuv "guruhga o'tgan" bo'lib tarixda qoladi,
 * yangi guruhda esa faol yozuv ochiladi.
 */
export function transferStudent(id: string, targetGroupId: string): Student | null {
  const source = getAppState().students.find((s) => s.id === id)
  if (!source || source.groupId === targetGroupId) return null
  const today = todayKey()
  const moved: Student = {
    ...source,
    id: createId('std'),
    groupId: targetGroupId,
    status: 'active',
    joinedAt: today,
    leftAt: undefined,
    transferredFromGroupId: source.groupId,
    transferredToGroupId: undefined,
  }
  updateApp((state) => ({
    ...state,
    students: [
      ...state.students.map((s) =>
        s.id === id ? { ...s, status: 'transferred' as const, leftAt: today, transferredToGroupId: targetGroupId } : s,
      ),
      moved,
    ],
    // Suhbatlar yangi yozuvga bog'lanadi
    conversations: state.conversations.map((c) => (c.studentId === id ? { ...c, studentId: moved.id } : c)),
  }))
  logActivity('student', `${groupName(source.groupId)} → ${groupName(targetGroupId)} guruhiga o'tkazildi`, fullName(source))
  return moved
}

/** O'quvchini butunlay o'chirish (davomat, baho va javoblari bilan) */
export function deleteStudent(id: string): void {
  updateApp((state) => ({
    ...state,
    students: state.students.filter((s) => s.id !== id),
    attendance: omitNested(state.attendance, id),
    grades: omitNested(state.grades, id),
    submissions: omitNested(state.submissions, id),
    tests: state.tests.map((t) =>
      t.results.some((r) => r.studentId === id) ? { ...t, results: t.results.filter((r) => r.studentId !== id) } : t,
    ),
    conversations: state.conversations.filter((c) => c.studentId !== id),
  }))
}
