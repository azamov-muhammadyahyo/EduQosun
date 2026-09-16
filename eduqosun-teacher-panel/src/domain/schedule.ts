import type { Group, Lesson, ScheduleSlot } from '../types'
import { WEEKDAYS_SHORT } from '../lib/date'
import { timesOverlap } from './lessons'

/** Yangi jadval boshqa faol guruhlar bilan vaqt jihatidan to'qnashadimi */
export function findScheduleConflicts(slots: ScheduleSlot[], groups: Group[], excludeGroupId?: string): string[] {
  const messages: string[] = []
  for (const slot of slots) {
    for (const group of groups) {
      if (group.id === excludeGroupId || group.status !== 'active') continue
      for (const other of group.schedule) {
        if (other.day !== slot.day) continue
        if (timesOverlap(slot.start, slot.end, other.start, other.end)) {
          messages.push(`${WEEKDAYS_SHORT[slot.day - 1]} ${slot.start}–${slot.end}: ${group.name} guruhi (${other.start}–${other.end}) bilan to'qnashadi`)
        }
      }
    }
  }
  return messages
}

/** Bir kundagi darslar orasida vaqt to'qnashuvi */
export function findLessonConflicts(
  lessons: Lesson[],
  start: string,
  end: string,
  groupName: (groupId: string) => string,
  excludeKey?: string,
): string[] {
  return lessons
    .filter((lesson) => lesson.key !== excludeKey && !lesson.canceled && timesOverlap(start, end, lesson.start, lesson.end))
    .map((lesson) => `${groupName(lesson.groupId)} guruhining ${lesson.start}–${lesson.end} darsi bilan to'qnashadi`)
}
