import type { Test, TestQuestion, TestStatus } from '../../types'
import { createId } from '../../lib/id'
import { getAppState, updateApp } from '../appStore'
import { logActivity } from './feed'

export interface TestDraft {
  id?: string
  title: string
  description: string
  groupId: string
  durationMin: number
  date: string
  questions: TestQuestion[]
}

function cleanQuestions(questions: TestQuestion[]): TestQuestion[] {
  return questions.map((question) => {
    // Bo'sh variantlarni olib tashlaymiz, to'g'ri javob indeksini moslaymiz
    const kept = question.options.map((text, index) => ({ text: text.trim(), index })).filter((o) => o.text)
    const correct = Math.max(0, kept.findIndex((o) => o.index === question.correct))
    return { ...question, text: question.text.trim(), options: kept.map((o) => o.text), correct }
  })
}

export function saveTest(draft: TestDraft, status: TestStatus): Test {
  const state = getAppState()
  const existing = draft.id ? state.tests.find((t) => t.id === draft.id) : undefined
  const test: Test = {
    id: existing?.id ?? createId('tst'),
    title: draft.title.trim(),
    description: draft.description.trim(),
    groupId: draft.groupId,
    durationMin: draft.durationMin,
    date: draft.date,
    questions: cleanQuestions(draft.questions),
    status,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    // Savollar o'zgarsa eski natijalar noto'g'ri bo'lib qoladi — shuning uchun faqat qoralamada tahrirlanadi
    results: existing?.results ?? [],
  }
  updateApp((s) => ({
    ...s,
    tests: existing ? s.tests.map((t) => (t.id === test.id ? test : t)) : [test, ...s.tests],
  }))
  if (!existing || existing.status !== status) {
    const group = state.groups.find((g) => g.id === test.groupId)
    if (status === 'published') logActivity('test', `«${test.title}» testi ${group?.name ?? ''} guruhiga e'lon qilindi`)
    else if (!existing) logActivity('test', `«${test.title}» testi qoralama sifatida saqlandi`)
  }
  return test
}

export function setTestStatus(id: string, status: TestStatus): void {
  updateApp((state) => ({
    ...state,
    tests: state.tests.map((t) => (t.id === id ? { ...t, status } : t)),
  }))
  const test = getAppState().tests.find((t) => t.id === id)
  if (!test) return
  if (status === 'published') logActivity('test', `«${test.title}» testi e'lon qilindi`)
  if (status === 'finished') logActivity('test', `«${test.title}» testi yakunlandi`)
}

export function duplicateTest(id: string): Test | null {
  const source = getAppState().tests.find((t) => t.id === id)
  if (!source) return null
  const copy: Test = {
    ...source,
    id: createId('tst'),
    title: `${source.title} (nusxa)`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    questions: source.questions.map((q) => ({ ...q, id: createId('q'), options: [...q.options] })),
    results: [],
  }
  updateApp((state) => ({ ...state, tests: [copy, ...state.tests] }))
  return copy
}

export function deleteTest(id: string): void {
  updateApp((state) => ({ ...state, tests: state.tests.filter((t) => t.id !== id) }))
}
