import type { ExtraLesson, LessonOverride } from '../../types'
import { formatDayMonth } from '../../lib/date'
import { createId } from '../../lib/id'
import { definedEntries } from '../../lib/object'
import { extraIdFromKey, extraLessonKey, findLesson, isExtraKey } from '../../domain/lessons'
import { getAppState, updateApp } from '../appStore'
import { logActivity } from './feed'

export type LessonPatch = Pick<LessonOverride, 'topic' | 'notes' | 'homework' | 'start' | 'end' | 'room' | 'canceled'>

/** Darsni tahrirlash: jadvaldagi dars uchun "override", bir martalik dars uchun — o'zi */
export function updateLesson(key: string, patch: LessonPatch): void {
  const changes = definedEntries(patch)
  if (isExtraKey(key)) {
    const id = extraIdFromKey(key)
    updateApp((state) => ({
      ...state,
      extraLessons: state.extraLessons.map((lesson) => (lesson.id === id ? { ...lesson, ...changes } : lesson)),
    }))
    return
  }
  updateApp((state) => ({
    ...state,
    lessonOverrides: { ...state.lessonOverrides, [key]: { ...state.lessonOverrides[key], ...changes } },
  }))
}

export function setLessonCanceled(key: string, canceled: boolean): void {
  updateLesson(key, { canceled })
  const state = getAppState()
  const lesson = findLesson(key, { groups: state.groups, overrides: state.lessonOverrides, extras: state.extraLessons })
  const group = state.groups.find((g) => g.id === lesson?.groupId)
  if (lesson && group) {
    const when = `${formatDayMonth(lesson.date)} ${lesson.start}`
    logActivity(
      'lesson',
      canceled ? `${group.name} guruhining ${when} darsi bekor qilindi` : `${group.name} guruhining ${when} darsi tiklandi`,
    )
  }
}

export type ExtraLessonInput = Omit<ExtraLesson, 'id' | 'canceled'>

export function createExtraLesson(input: ExtraLessonInput): ExtraLesson {
  const lesson: ExtraLesson = { ...input, id: createId('les'), canceled: false }
  updateApp((state) => ({ ...state, extraLessons: [...state.extraLessons, lesson] }))
  const group = getAppState().groups.find((g) => g.id === input.groupId)
  logActivity('lesson', `Guruh ${group?.name ?? ''} ga yangi dars qo'shildi (${formatDayMonth(input.date)}, ${input.start})`)
  return lesson
}

export function deleteExtraLesson(id: string): void {
  updateApp((state) => {
    const attendance = { ...state.attendance }
    delete attendance[extraLessonKey(id)]
    return { ...state, extraLessons: state.extraLessons.filter((lesson) => lesson.id !== id), attendance }
  })
}
