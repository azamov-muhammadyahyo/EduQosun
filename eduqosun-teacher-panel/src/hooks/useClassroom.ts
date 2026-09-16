import { useMemo } from 'react'
import type { Group, Student } from '../types'
import { lessonPhase } from '../domain/lessons'
import { currentRoster } from '../domain/students'
import { useApp } from '../store/appStore'
import { useClock } from '../store/clock'
import { useLessonsOn } from './useData'

export interface Classroom {
  roster: Student[]
  /** Bugungi darsda "keldi/kechikdi" deb belgilanganlar (davomat olinmagan bo'lsa — null) */
  presentIds: Set<string> | null
}

/** Sinf vositalari uchun: guruh tarkibi va bugungi davomat */
export function useClassroom(groupId: string): Classroom {
  const students = useApp((s) => s.students)
  const groups = useApp((s) => s.groups)
  const attendance = useApp((s) => s.attendance)
  const { today } = useClock()
  const lessons = useLessonsOn(today)

  return useMemo(() => {
    const group = groups.find((g) => g.id === groupId)
    if (!group) return { roster: [], presentIds: null }
    const roster = currentRoster(students, group)
    const lesson = lessons.find((l) => l.groupId === groupId && !l.canceled && attendance[l.key])
    if (!lesson) return { roster, presentIds: null }
    const record = attendance[lesson.key]
    const presentIds = new Set(
      Object.entries(record)
        .filter(([, mark]) => mark.status === 'present' || mark.status === 'late')
        .map(([id]) => id),
    )
    return { roster, presentIds }
  }, [groups, groupId, students, lessons, attendance])
}

/** Hozir (yoki bugun keyinroq) darsi bor guruh — vositalarda standart tanlov */
export function useDefaultClassGroup(): Group | undefined {
  const groups = useApp((s) => s.groups)
  const { today, minutes } = useClock()
  const lessons = useLessonsOn(today)
  return useMemo(() => {
    const active = lessons.filter((l) => !l.canceled)
    const live = active.find((l) => lessonPhase(l, today, minutes) === 'live')
    const next = active.find((l) => lessonPhase(l, today, minutes) === 'upcoming')
    const id = live?.groupId ?? next?.groupId ?? active[active.length - 1]?.groupId
    return groups.find((g) => g.id === id) ?? groups.find((g) => g.status === 'active')
  }, [groups, lessons, today, minutes])
}
