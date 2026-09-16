import type { Test, TestResult } from '../types'
import { average } from '../lib/format'

export function correctCount(test: Test, result: TestResult): number {
  return test.questions.reduce((sum, question, index) => sum + (result.answers[index] === question.correct ? 1 : 0), 0)
}

/** Natija foizda (0–100) */
export function resultPercent(test: Test, result: TestResult): number {
  if (test.questions.length === 0) return 0
  return (correctCount(test, result) / test.questions.length) * 100
}

export interface TestSummary {
  participants: number
  averagePercent: number | null
  best: number | null
  worst: number | null
}

export function testSummary(test: Test): TestSummary {
  const percents = test.results.map((result) => resultPercent(test, result))
  return {
    participants: test.results.length,
    averagePercent: average(percents),
    best: percents.length ? Math.max(...percents) : null,
    worst: percents.length ? Math.min(...percents) : null,
  }
}

/** Har bir savolga to'g'ri javob berganlar ulushi — eng qiyin savollarni aniqlash uchun */
export function questionCorrectRates(test: Test): number[] {
  return test.questions.map((question, index) => {
    if (test.results.length === 0) return 0
    const correct = test.results.filter((result) => result.answers[index] === question.correct).length
    return (correct / test.results.length) * 100
  })
}

/** Natijalar taqsimoti: 0–49, 50–69, 70–84, 85–100 */
export function resultBuckets(test: Test): { label: string; count: number }[] {
  const buckets = [
    { label: '0–49%', min: 0, max: 49.999, count: 0 },
    { label: '50–69%', min: 50, max: 69.999, count: 0 },
    { label: '70–84%', min: 70, max: 84.999, count: 0 },
    { label: '85–100%', min: 85, max: 100, count: 0 },
  ]
  for (const result of test.results) {
    const value = resultPercent(test, result)
    const bucket = buckets.find((b) => value >= b.min && value <= b.max)
    if (bucket) bucket.count += 1
  }
  return buckets.map(({ label, count }) => ({ label, count }))
}

/** Test tuzilmasini tekshiradi; xatolar ro'yxatini qaytaradi */
export function validateTest(test: Pick<Test, 'title' | 'questions' | 'durationMin'>): string[] {
  const errors: string[] = []
  if (!test.title.trim()) errors.push('Test nomini kiriting')
  if (test.durationMin < 1) errors.push("Davomiylik kamida 1 daqiqa bo'lishi kerak")
  if (test.questions.length === 0) errors.push("Kamida bitta savol qo'shing")
  test.questions.forEach((question, index) => {
    const n = index + 1
    if (!question.text.trim()) errors.push(`${n}-savol matni bo'sh`)
    const filled = question.options.filter((option) => option.trim()).length
    if (filled < 2) errors.push(`${n}-savolda kamida 2 ta javob varianti bo'lishi kerak`)
    if (!question.options[question.correct]?.trim()) errors.push(`${n}-savol uchun to'g'ri javobni belgilang`)
  })
  return errors
}
