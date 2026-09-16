import type { Assessment, Assignment, DateKey, Submission, Test } from '../types'
import { assessmentTypeLabel } from '../data/catalog'
import { toTenScale } from './assignments'
import { resultPercent } from './tests'

/*
 * Baholar jurnali uch manbani birlashtiradi:
 *  - qo'lda qo'shilgan baholash ustunlari (faollik, so'rov, nazorat ishi…)
 *  - topshiriqlar (baholangan javoblar)
 *  - testlar (avtomatik hisoblangan natija)
 * Hammasi 10 ballik shkalaga keltiriladi.
 */

export type GradeSource = 'assessment' | 'assignment' | 'test'

export interface GradeColumn {
  id: string
  source: GradeSource
  refId: string
  groupId: string
  title: string
  typeLabel: string
  date: DateKey
  /** Jurnalda to'g'ridan-to'g'ri tahrirlash mumkinmi */
  editable: boolean
  /** Asl maksimal ball (topshiriqlar uchun) */
  maxScore: number
}

export interface GradeInputs {
  assessments: Assessment[]
  grades: Record<string, Record<string, number>>
  assignments: Assignment[]
  submissions: Record<string, Record<string, Submission>>
  tests: Test[]
}

export const MAX_GRADE = 10

export function gradeColumns(groupId: string, inputs: GradeInputs): GradeColumn[] {
  const columns: GradeColumn[] = []

  for (const item of inputs.assessments) {
    if (item.groupId !== groupId) continue
    columns.push({
      id: `a:${item.id}`,
      source: 'assessment',
      refId: item.id,
      groupId,
      title: item.title,
      typeLabel: assessmentTypeLabel[item.type],
      date: item.date,
      editable: true,
      maxScore: MAX_GRADE,
    })
  }

  for (const item of inputs.assignments) {
    if (item.groupId !== groupId) continue
    columns.push({
      id: `h:${item.id}`,
      source: 'assignment',
      refId: item.id,
      groupId,
      title: item.title,
      typeLabel: 'Topshiriq',
      date: item.dueDate,
      editable: true,
      maxScore: item.maxScore,
    })
  }

  for (const item of inputs.tests) {
    if (item.groupId !== groupId || item.status === 'draft' || item.results.length === 0) continue
    columns.push({
      id: `t:${item.id}`,
      source: 'test',
      refId: item.id,
      groupId,
      title: item.title,
      typeLabel: 'Test',
      date: item.date,
      editable: false,
      maxScore: MAX_GRADE,
    })
  }

  return columns.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
}

/** Katakdagi baho (10 ballik), bo'lmasa null */
export function gradeFor(column: GradeColumn, studentId: string, inputs: GradeInputs): number | null {
  switch (column.source) {
    case 'assessment':
      return inputs.grades[column.refId]?.[studentId] ?? null
    case 'assignment': {
      const submission = inputs.submissions[column.refId]?.[studentId]
      if (submission?.score === undefined) return null
      return toTenScale(submission.score, column.maxScore)
    }
    case 'test': {
      const test = inputs.tests.find((item) => item.id === column.refId)
      const result = test?.results.find((item) => item.studentId === studentId)
      return test && result ? resultPercent(test, result) / 10 : null
    }
  }
}

/** Baho ko'rinishi: butun bo'lsa "9", aks holda "8.5" */
export function formatGrade(value: number | null): string {
  if (value === null) return ''
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** Foydalanuvchi kiritgan qiymatni tekshiradi: '' → null, noto'g'ri → undefined */
export function parseGradeInput(raw: string): number | null | undefined {
  const text = raw.trim().replace(',', '.')
  if (text === '') return null
  const value = Number(text)
  if (!Number.isFinite(value) || value < 0 || value > MAX_GRADE) return undefined
  return Math.round(value * 10) / 10
}
