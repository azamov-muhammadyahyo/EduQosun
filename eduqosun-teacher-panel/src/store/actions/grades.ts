import type { Assessment, Submission } from '../../types'
import { createId } from '../../lib/id'
import { formatGrade, type GradeColumn } from '../../domain/grades'
import { fullName } from '../../domain/students'
import { getAppState, updateApp } from '../appStore'
import { logActivity } from './feed'

export type AssessmentInput = Omit<Assessment, 'id'>

export function createAssessment(input: AssessmentInput): Assessment {
  const assessment: Assessment = { ...input, title: input.title.trim(), id: createId('asm') }
  updateApp((state) => ({
    ...state,
    assessments: [...state.assessments, assessment],
    grades: { ...state.grades, [assessment.id]: {} },
  }))
  const group = getAppState().groups.find((g) => g.id === input.groupId)
  logActivity('grade', `${group?.name ?? ''} guruhi jurnaliga «${assessment.title}» ustuni qo'shildi`)
  return assessment
}

export function updateAssessment(id: string, patch: Partial<AssessmentInput>): void {
  updateApp((state) => ({
    ...state,
    assessments: state.assessments.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }))
}

export function deleteAssessment(id: string): void {
  updateApp((state) => {
    const grades = { ...state.grades }
    delete grades[id]
    return { ...state, assessments: state.assessments.filter((item) => item.id !== id), grades }
  })
}

/**
 * Jurnal katagiga baho qo'yish (10 ballik).
 * Topshiriq ustunida baho javobning balliga aylantiriladi.
 */
export function setGrade(column: GradeColumn, studentId: string, value: number | null, previous: number | null): void {
  if (column.source === 'test') return

  if (column.source === 'assessment') {
    updateApp((state) => {
      const record = { ...(state.grades[column.refId] ?? {}) }
      if (value === null) delete record[studentId]
      else record[studentId] = value
      return { ...state, grades: { ...state.grades, [column.refId]: record } }
    })
  } else {
    updateApp((state) => {
      const record = { ...(state.submissions[column.refId] ?? {}) }
      const existing = record[studentId]
      if (value === null) {
        if (existing) {
          const cleared: Submission = { ...existing }
          delete cleared.score
          delete cleared.gradedAt
          record[studentId] = cleared
        }
      } else {
        const now = new Date().toISOString()
        const base: Submission = existing ?? { studentId, submittedAt: now, answer: "Qog'ozda topshirilgan" }
        record[studentId] = {
          ...base,
          score: Math.round((value / 10) * column.maxScore * 10) / 10,
          gradedAt: now,
        }
      }
      return { ...state, submissions: { ...state.submissions, [column.refId]: record } }
    })
  }

  // Mavjud bahoni o'zgartirish faoliyat tarixiga yoziladi (yangi baholar — shovqin bo'lmasligi uchun yo'q)
  if (previous !== null && value !== null && previous !== value) {
    const student = getAppState().students.find((s) => s.id === studentId)
    if (student) logActivity('grade', `bahosi yangilandi (${formatGrade(previous)} → ${formatGrade(value)})`, fullName(student))
  }
}
