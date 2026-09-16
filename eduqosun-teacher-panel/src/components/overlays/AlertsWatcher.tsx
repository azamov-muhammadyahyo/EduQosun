import { useEffect, useRef } from 'react'
import { addDays, isoAt, startOfWeek, toMinutes } from '../../lib/date'
import { readStorage, writeStorage } from '../../lib/storage'
import { attendanceByRanges } from '../../domain/analytics'
import { lessonPhase, lessonsInRange, lessonsOnDate } from '../../domain/lessons'
import { getAppState } from '../../store/appStore'
import { useClock } from '../../store/clock'
import { pushNotification } from '../../store/actions/feed'
import { markReminderNotified } from '../../store/actions/reminders'
import { toast } from '../../store/toastStore'
import { openDrawer, openModal } from '../../store/uiStore'

/** Eslatma vaqtidan qancha oldin ogohlantirish (daqiqa) */
const REMINDER_LEAD_MINUTES = 15

const WEEKLY_REPORT_KEY = 'eduqosun-weekly-report'

/** O'tgan hafta bo'yicha qisqa hisobot (haftasiga bir marta) */
function sendWeeklyReport(today: string, minutes: number): void {
  const week = startOfWeek(today)
  if (readStorage(WEEKLY_REPORT_KEY) === week) return
  writeStorage(WEEKLY_REPORT_KEY, week)
  const state = getAppState()
  const from = addDays(week, -7)
  const to = addDays(week, -1)
  const sources = { groups: state.groups, overrides: state.lessonOverrides, extras: state.extraLessons }
  const held = lessonsInRange(from, to, sources).filter((l) => lessonPhase(l, today, minutes) === 'held').length
  const [bucket] = attendanceByRanges([{ label: '', from, to }], state.attendance, state.extraLessons)
  const rate = bucket.rate === null ? "ma'lumot yo'q" : `${Math.round(bucket.rate)}%`
  pushNotification(
    {
      kind: 'system',
      title: 'Haftalik hisobot',
      text: `O'tgan hafta: ${held} ta dars o'tkazildi, o'rtacha davomat ${rate}.`,
      route: 'statistics',
    },
    { sound: false },
  )
}

/**
 * Har daqiqada tekshiradi:
 *  - vaqti yaqinlashgan eslatmalar → bildirishnoma + toast (bir marta)
 *  - boshlanishiga N daqiqa qolgan darslar → toast (seans davomida bir marta)
 */
export function AlertsWatcher() {
  const { now, today, minutes } = useClock()
  const announcedLessons = useRef(new Set<string>())

  useEffect(() => {
    const state = getAppState()
    const { settings } = state

    if (settings.notifyReminders) {
      for (const reminder of state.reminders) {
        if (reminder.done || reminder.notified || !reminder.time || reminder.date !== today) continue
        const dueAt = new Date(isoAt(reminder.date, reminder.time)).getTime()
        const minutesLeft = Math.round((dueAt - now.getTime()) / 60_000)
        if (minutesLeft > REMINDER_LEAD_MINUTES || minutesLeft < -60) continue
        markReminderNotified(reminder.id)
        const when = minutesLeft > 0 ? `${minutesLeft} daqiqadan so'ng` : 'hozir'
        pushNotification({ kind: 'reminder', title: 'Eslatma', text: `${reminder.time} — ${reminder.title}`, route: 'reminders' })
        toast({
          tone: 'warning',
          title: `Eslatma: ${when}`,
          description: reminder.title,
          actionLabel: 'Ochish',
          onAction: () => openModal({ type: 'reminder-form', reminderId: reminder.id }),
        })
      }
    }

    if (settings.weeklyReport) sendWeeklyReport(today, minutes)

    if (settings.lessonReminder) {
      const lessons = lessonsOnDate(today, { groups: state.groups, overrides: state.lessonOverrides, extras: state.extraLessons })
      for (const lesson of lessons) {
        if (lesson.canceled || announcedLessons.current.has(lesson.key)) continue
        const minutesLeft = toMinutes(lesson.start) - minutes
        if (minutesLeft < 1 || minutesLeft > settings.lessonReminderMinutes) continue
        announcedLessons.current.add(lesson.key)
        const group = state.groups.find((g) => g.id === lesson.groupId)
        toast({
          tone: 'info',
          title: `${minutesLeft} daqiqadan so'ng dars`,
          description: `${lesson.start} · ${group?.name ?? ''} — ${lesson.topic}`,
          actionLabel: 'Batafsil',
          onAction: () => openDrawer({ type: 'lesson', lessonKey: lesson.key }),
        })
        pushNotification(
          { kind: 'lesson', title: 'Dars yaqinlashmoqda', text: `${lesson.start} — ${group?.name ?? ''}: ${lesson.topic}`, route: 'lessons' },
          { sound: settings.sound },
        )
      }
    }
  }, [now, today, minutes])

  return null
}
