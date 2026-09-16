import type { DateKey, ExtraLesson, Group, Lesson, LessonOverride, LessonPhase, ScheduleSlot } from '../types'
import { addDays, dateRange, diffDays, toMinutes, weekdayOf } from '../lib/date'

/*
 * Darslar oldindan saqlanmaydi: ular guruhning haftalik jadvalidan istalgan sana uchun hosil qilinadi.
 * O'qituvchi kiritgan o'zgarishlar (mavzu, bekor qilish, izoh) alohida `overrides`da saqlanadi,
 * jadvaldan tashqari darslar esa `extraLessons` ro'yxatida turadi.
 */

export interface LessonSources {
  groups: Group[]
  overrides: Record<string, LessonOverride>
  extras: ExtraLesson[]
}

const KEY_SEPARATOR = '|'

export function scheduleLessonKey(groupId: string, date: DateKey, start: string): string {
  return [groupId, date, start].join(KEY_SEPARATOR)
}

export function extraLessonKey(id: string): string {
  return `x${KEY_SEPARATOR}${id}`
}

export function isExtraKey(key: string): boolean {
  return key.startsWith(`x${KEY_SEPARATOR}`)
}

export function extraIdFromKey(key: string): string {
  return key.slice(2)
}

/** Guruh shu kuni o'qiyaptimi (kurs sanalari oralig'ida) */
export function isGroupRunningOn(group: Group, date: DateKey): boolean {
  if (date < group.startDate) return false
  if (group.endDate && date > group.endDate) return false
  return true
}

/** Kurs boshidan `date`gacha (shu kun kirmaydi) nechta dars bo'lgan */
function countLessonsBefore(group: Group, date: DateKey): number {
  const days = diffDays(date, group.startDate)
  if (days <= 0) return 0
  const fullWeeks = Math.floor(days / 7)
  let count = fullWeeks * group.schedule.length
  const startWeekday = weekdayOf(group.startDate)
  for (let i = 0; i < days % 7; i += 1) {
    const weekday = ((startWeekday - 1 + i) % 7) + 1
    count += group.schedule.filter((slot) => slot.day === weekday).length
  }
  return count
}

function lessonNumber(group: Group, date: DateKey, slot: ScheduleSlot): number {
  const weekday = weekdayOf(date)
  const sameDayBefore = group.schedule.filter((s) => s.day === weekday && s.start <= slot.start).length
  return countLessonsBefore(group, date) + sameDayBefore
}

function topicFor(group: Group, number: number): string {
  if (group.curriculum.length === 0) return group.subject
  return group.curriculum[(number - 1) % group.curriculum.length]
}

function fromExtra(extra: ExtraLesson): Lesson {
  return {
    key: extraLessonKey(extra.id),
    groupId: extra.groupId,
    date: extra.date,
    start: extra.start,
    end: extra.end,
    topic: extra.topic,
    kind: extra.kind,
    room: extra.room,
    number: null,
    canceled: extra.canceled,
    notes: extra.notes,
    homework: extra.homework,
    isExtra: true,
  }
}

function byStart(a: Lesson, b: Lesson): number {
  return a.start.localeCompare(b.start) || a.groupId.localeCompare(b.groupId)
}

/** Bitta kunning barcha darslari (vaqt bo'yicha tartiblangan) */
export function lessonsOnDate(date: DateKey, { groups, overrides, extras }: LessonSources): Lesson[] {
  const weekday = weekdayOf(date)
  const result: Lesson[] = []

  for (const group of groups) {
    if (!isGroupRunningOn(group, date)) continue
    for (const slot of group.schedule) {
      if (slot.day !== weekday) continue
      const key = scheduleLessonKey(group.id, date, slot.start)
      const override = overrides[key]
      const number = lessonNumber(group, date, slot)
      result.push({
        key,
        groupId: group.id,
        date,
        start: override?.start ?? slot.start,
        end: override?.end ?? slot.end,
        topic: override?.topic ?? topicFor(group, number),
        kind: slot.kind,
        room: override?.room ?? group.room,
        number,
        canceled: override?.canceled ?? false,
        notes: override?.notes ?? '',
        homework: override?.homework ?? '',
        isExtra: false,
      })
    }
  }

  for (const extra of extras) {
    if (extra.date === date) result.push(fromExtra(extra))
  }

  return result.sort(byStart)
}

/** Oraliqdagi darslar (ikkala chegara ham kiradi) */
export function lessonsInRange(from: DateKey, to: DateKey, sources: LessonSources): Lesson[] {
  return dateRange(from, to).flatMap((date) => lessonsOnDate(date, sources))
}

/** Kalit bo'yicha darsni topadi */
export function findLesson(key: string, sources: LessonSources): Lesson | null {
  if (isExtraKey(key)) {
    const extra = sources.extras.find((item) => item.id === extraIdFromKey(key))
    return extra ? fromExtra(extra) : null
  }
  const [groupId, date] = key.split(KEY_SEPARATOR)
  if (!groupId || !date) return null
  return lessonsOnDate(date, { ...sources, extras: [] }).find((lesson) => lesson.key === key) ?? null
}

/** Guruhning `date`dan keyingi (yoki oldingi) eng yaqin darsi */
export function adjacentLessonDate(
  group: Group,
  date: DateKey,
  direction: 1 | -1,
  sources: LessonSources,
): DateKey | null {
  const groupSources = { ...sources, groups: [group], extras: sources.extras.filter((e) => e.groupId === group.id) }
  for (let step = 1; step <= 60; step += 1) {
    const candidate = addDays(date, step * direction)
    if (lessonsOnDate(candidate, groupSources).length > 0) return candidate
  }
  return null
}

/** Dars holati — joriy vaqtga nisbatan */
export function lessonPhase(lesson: Lesson, today: DateKey, nowMinutes: number): LessonPhase {
  if (lesson.canceled) return 'canceled'
  if (lesson.date < today) return 'held'
  if (lesson.date > today) return 'planned'
  if (nowMinutes >= toMinutes(lesson.end)) return 'held'
  if (nowMinutes >= toMinutes(lesson.start)) return 'live'
  return 'upcoming'
}

export function lessonDuration(lesson: Pick<Lesson, 'start' | 'end'>): number {
  return Math.max(0, toMinutes(lesson.end) - toMinutes(lesson.start))
}

/** Dars boshlanishigacha qolgan daqiqalar (bugungi darslar uchun) */
export function minutesUntilStart(lesson: Lesson, nowMinutes: number): number {
  return toMinutes(lesson.start) - nowMinutes
}

/** Dars tugashiga qolgan daqiqalar */
export function minutesUntilEnd(lesson: Lesson, nowMinutes: number): number {
  return toMinutes(lesson.end) - nowMinutes
}

/** Ikki vaqt oralig'i ustma-ust tushadimi */
export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd)
}
