import { useMemo } from 'react'
import type { AccentColor, DateKey, Group, Lesson, Student } from '../types'
import { endOfMonth, startOfMonth } from '../lib/date'
import { findLesson, lessonsInRange, lessonsOnDate, type LessonSources } from '../domain/lessons'
import type { GroupMetrics, StudentMetrics } from '../domain/analytics'
import { useApp } from '../store/appStore'
import {
  selectActiveGroups,
  selectGroupMap,
  selectGroupMetrics,
  selectLessonSources,
  selectStudentMap,
  selectStudentMetrics,
} from '../store/selectors'

/* Sahifalar uchun qulay ma'lumot hook'lari */

export function useLessonSources(): LessonSources {
  return useApp(selectLessonSources)
}

export function useLessonsOn(date: DateKey): Lesson[] {
  const sources = useLessonSources()
  return useMemo(() => lessonsOnDate(date, sources), [date, sources])
}

export function useLessonsInRange(from: DateKey, to: DateKey): Lesson[] {
  const sources = useLessonSources()
  return useMemo(() => lessonsInRange(from, to, sources), [from, to, sources])
}

export function useLesson(key: string | null): Lesson | null {
  const sources = useLessonSources()
  return useMemo(() => (key ? findLesson(key, sources) : null), [key, sources])
}

export function useGroups(): Group[] {
  return useApp((s) => s.groups)
}

export function useActiveGroups(): Group[] {
  return useApp(selectActiveGroups)
}

export function useGroupMap(): Map<string, Group> {
  return useApp(selectGroupMap)
}

export function useStudents(): Student[] {
  return useApp((s) => s.students)
}

export function useStudentMap(): Map<string, Student> {
  return useApp(selectStudentMap)
}

export function useStudentMetrics(): Map<string, StudentMetrics> {
  return useApp(selectStudentMetrics)
}

export function useGroupMetrics(): Map<string, GroupMetrics> {
  return useApp(selectGroupMetrics)
}

export function useProfile() {
  return useApp((s) => s.profile)
}

export function useSettings() {
  return useApp((s) => s.settings)
}

/** "Azamatov Sardor" — dizayndagidek familiya birinchi */
export function useTeacherName(): string {
  const profile = useProfile()
  return `${profile.lastName} ${profile.firstName}`.trim()
}

/** Taqvim nuqtalari: oy davomidagi har kun uchun darslar guruhlari ranglari */
export function useLessonMarkers(month: DateKey, groupId?: string): Record<DateKey, AccentColor[]> {
  const sources = useLessonSources()
  const groupMap = useGroupMap()
  return useMemo(() => {
    const markers: Record<DateKey, AccentColor[]> = {}
    for (const lesson of lessonsInRange(startOfMonth(month), endOfMonth(month), sources)) {
      if (lesson.canceled || (groupId && lesson.groupId !== groupId)) continue
      const color = groupMap.get(lesson.groupId)?.color ?? 'blue'
      ;(markers[lesson.date] ??= []).push(color)
    }
    return markers
  }, [month, groupId, sources, groupMap])
}
