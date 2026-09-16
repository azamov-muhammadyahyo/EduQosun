import type { DateKey, Group, Student } from '../types'

export function fullName(student: Pick<Student, 'firstName' | 'lastName'>): string {
  return `${student.firstName} ${student.lastName}`.trim()
}

/** Familiya bo'yicha tartiblash (o'zbekcha alifbo) */
export function compareStudents(a: Student, b: Student): number {
  return (
    a.lastName.localeCompare(b.lastName, 'uz') || a.firstName.localeCompare(b.firstName, 'uz')
  )
}

/** O'quvchi shu kuni guruhda o'qiganmi */
export function isEnrolledOn(student: Student, date: DateKey): boolean {
  if (student.joinedAt > date) return false
  if (student.leftAt && date >= student.leftAt) return false
  return true
}

/** Guruhning ayni paytdagi tarkibi (tugagan guruhda — bitiruvchilar) */
export function currentRoster(students: Student[], group: Pick<Group, 'id' | 'status'>): Student[] {
  const status = group.status === 'completed' ? 'graduated' : 'active'
  return students.filter((s) => s.groupId === group.id && s.status === status).sort(compareStudents)
}

/** Belgilangan sanadagi guruh tarkibi (davomat uchun) */
export function rosterOn(students: Student[], groupId: string, date: DateKey): Student[] {
  return students.filter((s) => s.groupId === groupId && isEnrolledOn(s, date)).sort(compareStudents)
}

/** Faol (o'qiyotgan) o'quvchilar */
export function activeStudents(students: Student[]): Student[] {
  return students.filter((s) => s.status === 'active')
}

export interface RosterBreakdown {
  total: number
  active: number
  left: number
  transferred: number
  graduated: number
}

export function rosterBreakdown(students: Student[], groupId?: string): RosterBreakdown {
  const list = groupId ? students.filter((s) => s.groupId === groupId) : students
  const result: RosterBreakdown = { total: list.length, active: 0, left: 0, transferred: 0, graduated: 0 }
  for (const student of list) result[student.status] += 1
  return result
}
