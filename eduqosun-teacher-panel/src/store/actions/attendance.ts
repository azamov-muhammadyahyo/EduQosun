import type { AttendanceMark, AttendanceStatus, LessonAttendance } from '../../types'
import { updateApp } from '../appStore'

function writeRecord(lessonKey: string, recipe: (record: LessonAttendance) => LessonAttendance): void {
  updateApp((state) => {
    const next = recipe({ ...(state.attendance[lessonKey] ?? {}) })
    const attendance = { ...state.attendance }
    if (Object.keys(next).length === 0) delete attendance[lessonKey]
    else attendance[lessonKey] = next
    return { ...state, attendance }
  })
}

/** Holatni belgilash; `null` — belgini olib tashlash */
export function setAttendanceStatus(lessonKey: string, studentId: string, status: AttendanceStatus | null): void {
  writeRecord(lessonKey, (record) => {
    if (status === null) {
      delete record[studentId]
      return record
    }
    const previous = record[studentId]
    const present = status === 'present' || status === 'late'
    const mark: AttendanceMark = { status }
    // Uy vazifasi belgisi faqat darsda bo'lganlar uchun saqlanadi
    if (present && previous?.homework !== undefined) mark.homework = previous.homework
    record[studentId] = mark
    return record
  })
}

/** Uy vazifasi: true/false yoki belgilanmagan (undefined) */
export function setHomework(lessonKey: string, studentId: string, done: boolean | undefined): void {
  writeRecord(lessonKey, (record) => {
    const previous = record[studentId] ?? { status: 'present' as const }
    const mark: AttendanceMark = { status: previous.status }
    if (done !== undefined) mark.homework = done
    record[studentId] = mark
    return record
  })
}

/** Belgilanmagan o'quvchilarni "keldi" deb belgilash */
export function markRemainingPresent(lessonKey: string, studentIds: string[]): number {
  let changed = 0
  writeRecord(lessonKey, (record) => {
    for (const id of studentIds) {
      if (record[id]) continue
      record[id] = { status: 'present' }
      changed += 1
    }
    return record
  })
  return changed
}

/** Hammasini "keldi" deb belgilash (oldingi belgilar ustidan) */
export function markAllPresent(lessonKey: string, studentIds: string[]): void {
  writeRecord(lessonKey, (record) => {
    for (const id of studentIds) {
      const homework = record[id]?.homework
      record[id] = homework === undefined ? { status: 'present' } : { status: 'present', homework }
    }
    return record
  })
}

/** Keldi deb belgilanganlarning barchasiga uy vazifasi belgisini qo'yish */
export function markAllHomework(lessonKey: string, studentIds: string[], done: boolean): void {
  writeRecord(lessonKey, (record) => {
    for (const id of studentIds) {
      const mark = record[id]
      if (mark && (mark.status === 'present' || mark.status === 'late')) record[id] = { ...mark, homework: done }
    }
    return record
  })
}

export function clearAttendance(lessonKey: string): void {
  writeRecord(lessonKey, () => ({}))
}
