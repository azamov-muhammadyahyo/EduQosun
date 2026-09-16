import type { Reminder } from '../../types'
import { addDays, todayKey } from '../../lib/date'
import { createId } from '../../lib/id'
import { updateApp } from '../appStore'

export type ReminderInput = Pick<Reminder, 'title' | 'note' | 'date' | 'time' | 'priority' | 'category' | 'groupId'>

export function createReminder(input: ReminderInput): Reminder {
  const reminder: Reminder = {
    ...input,
    title: input.title.trim(),
    note: input.note.trim(),
    id: createId('rem'),
    done: false,
    createdAt: new Date().toISOString(),
  }
  updateApp((state) => ({ ...state, reminders: [reminder, ...state.reminders] }))
  return reminder
}

export function updateReminder(id: string, patch: Partial<ReminderInput>): void {
  updateApp((state) => ({
    ...state,
    // Sana/vaqt o'zgarsa eslatma qayta bildirilishi kerak
    reminders: state.reminders.map((r) =>
      r.id === id ? { ...r, ...patch, notified: patch.date || patch.time ? false : r.notified } : r,
    ),
  }))
}

export function toggleReminder(id: string): void {
  updateApp((state) => ({
    ...state,
    reminders: state.reminders.map((r) =>
      r.id === id ? { ...r, done: !r.done, doneAt: r.done ? undefined : new Date().toISOString() } : r,
    ),
  }))
}

/** Eslatmani keyingi kunga (yoki N kunga) ko'chirish */
export function snoozeReminder(id: string, days = 1): void {
  const today = todayKey()
  updateApp((state) => ({
    ...state,
    reminders: state.reminders.map((r) => {
      if (r.id !== id) return r
      const base = r.date < today ? today : r.date
      return { ...r, date: addDays(base, days), notified: false }
    }),
  }))
}

export function markReminderNotified(id: string): void {
  updateApp((state) => ({
    ...state,
    reminders: state.reminders.map((r) => (r.id === id ? { ...r, notified: true } : r)),
  }))
}

export function deleteReminder(id: string): void {
  updateApp((state) => ({ ...state, reminders: state.reminders.filter((r) => r.id !== id) }))
}

export function clearCompletedReminders(): number {
  let removed = 0
  updateApp((state) => {
    const reminders = state.reminders.filter((r) => !r.done)
    removed = state.reminders.length - reminders.length
    return { ...state, reminders }
  })
  return removed
}
