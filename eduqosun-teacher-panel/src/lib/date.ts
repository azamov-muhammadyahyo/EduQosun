import type { DateKey, TimeString, Weekday } from '../types'

/*
 * Sana bilan ishlash. Kunlar mahalliy vaqt bo'yicha 'YYYY-MM-DD' satr ko'rinishida saqlanadi —
 * shunda vaqt mintaqasi siljishlari (UTC) sana almashib ketishiga olib kelmaydi.
 */

export const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
] as const

export const MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'] as const

export const WEEKDAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'] as const

export const WEEKDAYS_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'] as const

const DAY_MS = 86_400_000

const pad = (n: number) => String(n).padStart(2, '0')

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/* ———————————————————— Sana kalitlari ———————————————————— */

export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDateKey(value).getTime())
}

export function todayKey(): DateKey {
  return toDateKey(new Date())
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

/** Oy qo'shadi va oyning 1-kunini qaytaradi */
export function addMonths(key: DateKey, months: number): DateKey {
  const date = parseDateKey(key)
  date.setDate(1)
  date.setMonth(date.getMonth() + months)
  return toDateKey(date)
}

/** a − b (kunlarda) */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((parseDateKey(a).getTime() - parseDateKey(b).getTime()) / DAY_MS)
}

export function weekdayOf(key: DateKey): Weekday {
  const day = parseDateKey(key).getDay()
  return (day === 0 ? 7 : day) as Weekday
}

/** Hafta Dushanbadan boshlanadi */
export function startOfWeek(key: DateKey): DateKey {
  return addDays(key, 1 - weekdayOf(key))
}

export function weekDates(key: DateKey): DateKey[] {
  const start = startOfWeek(key)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function startOfMonth(key: DateKey): DateKey {
  return `${key.slice(0, 7)}-01`
}

export function daysInMonth(key: DateKey): number {
  const date = parseDateKey(key)
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function endOfMonth(key: DateKey): DateKey {
  return `${key.slice(0, 7)}-${pad(daysInMonth(key))}`
}

export function isSameMonth(a: DateKey, b: DateKey): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

/** from…to (ikkalasi ham kiradi) */
export function dateRange(from: DateKey, to: DateKey): DateKey[] {
  const result: DateKey[] = []
  for (let key = from; key <= to; key = addDays(key, 1)) result.push(key)
  return result
}

/** Oy taqvimi katakchalari: hafta Dushanbadan, bo'sh joylar null */
export function monthGrid(key: DateKey): (DateKey | null)[] {
  const first = startOfMonth(key)
  const cells: (DateKey | null)[] = Array.from({ length: weekdayOf(first) - 1 }, () => null)
  const total = daysInMonth(key)
  for (let day = 0; day < total; day += 1) cells.push(addDays(first, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function dayOfMonth(key: DateKey): number {
  return Number(key.slice(8, 10))
}

/* ———————————————————— Vaqt ———————————————————— */

export function toMinutes(time: TimeString): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function fromMinutes(total: number): TimeString {
  const safe = Math.max(0, Math.min(total, 24 * 60 - 1))
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

export function timeOf(date: Date): TimeString {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function isoAt(key: DateKey, time: TimeString): string {
  const date = parseDateKey(key)
  const [h, m] = time.split(':').map(Number)
  date.setHours(h, m, 0, 0)
  return date.toISOString()
}

export function dateKeyOfIso(iso: string): DateKey {
  return toDateKey(new Date(iso))
}

/* ———————————————————— Formatlash ———————————————————— */

/** 12-may */
export function formatDayMonth(key: DateKey): string {
  const date = parseDateKey(key)
  return `${date.getDate()}-${MONTHS[date.getMonth()]}`
}

/** 12-may 2025 */
export function formatDate(key: DateKey): string {
  return `${formatDayMonth(key)} ${key.slice(0, 4)}`
}

export function weekdayName(key: DateKey): string {
  return WEEKDAYS[weekdayOf(key) - 1]
}

export function weekdayShort(key: DateKey): string {
  return WEEKDAYS_SHORT[weekdayOf(key) - 1]
}

/** 12-may 2025, Dushanba */
export function formatDateWithWeekday(key: DateKey): string {
  return `${formatDate(key)}, ${weekdayName(key)}`
}

/** Dushanba, 12-may 2025 */
export function formatWeekdayDate(key: DateKey): string {
  return `${weekdayName(key)}, ${formatDate(key)}`
}

/** 12.05.2025 */
export function formatNumericDate(key: DateKey): string {
  return `${key.slice(8, 10)}.${key.slice(5, 7)}.${key.slice(0, 4)}`
}

/** May 2025 */
export function formatMonthYear(key: DateKey): string {
  const date = parseDateKey(key)
  return `${capitalize(MONTHS[date.getMonth()])} ${date.getFullYear()}`
}

/** 12–18-may 2025 · 29-sentabr – 5-oktabr 2025 */
export function formatWeekRange(key: DateKey): string {
  const start = startOfWeek(key)
  const end = addDays(start, 6)
  const s = parseDateKey(start)
  const e = parseDateKey(end)
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()}-${MONTHS[e.getMonth()]} ${e.getFullYear()}`
  }
  const tail = s.getFullYear() === e.getFullYear() ? '' : ` ${s.getFullYear()}`
  return `${formatDayMonth(start)}${tail} – ${formatDayMonth(end)} ${e.getFullYear()}`
}

/** 12.05.2025 10:24 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return `${formatNumericDate(toDateKey(date))} ${timeOf(date)}`
}

/** 90 → "1 soat 30 daqiqa" */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  const h = Math.floor(safe / 60)
  const m = safe % 60
  if (h === 0) return `${m} daqiqa`
  if (m === 0) return `${h} soat`
  return `${h} soat ${m} daqiqa`
}

/** 90 → "1 s 30 daq" (tor joylar uchun) */
export function formatShortDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  const h = Math.floor(safe / 60)
  const m = safe % 60
  if (h === 0) return `${m} daq`
  if (m === 0) return `${h} soat`
  return `${h} s ${m} daq`
}

/** 125 → "02:05" (taymer) */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** Bugun | Ertaga | Kecha | 3 kundan keyin | 2 kun oldin | 12-may */
export function formatRelativeDay(key: DateKey, today: DateKey): string {
  const diff = diffDays(key, today)
  if (diff === 0) return 'Bugun'
  if (diff === 1) return 'Ertaga'
  if (diff === -1) return 'Kecha'
  if (diff > 1 && diff <= 6) return `${diff} kundan keyin`
  if (diff < -1 && diff >= -6) return `${-diff} kun oldin`
  return key.slice(0, 4) === today.slice(0, 4) ? formatDayMonth(key) : formatDate(key)
}

/** Suhbatlar ro'yxati: bugun → 10:24, kecha → Kecha, boshqa → 12.05 */
export function formatChatTime(iso: string, now: Date): string {
  const date = new Date(iso)
  const key = toDateKey(date)
  const today = toDateKey(now)
  if (key === today) return timeOf(date)
  if (key === addDays(today, -1)) return 'Kecha'
  if (diffDays(today, key) < 7) return weekdayName(key)
  return key.slice(0, 4) === today.slice(0, 4) ? `${key.slice(8, 10)}.${key.slice(5, 7)}` : formatNumericDate(key)
}

/** Hozirgina | 5 daqiqa oldin | 2 soat oldin | Kecha, 14:10 | 12.05.2025 */
export function formatTimeAgo(iso: string, now: Date): string {
  const date = new Date(iso)
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000)
  if (minutes < 1) return 'Hozirgina'
  if (minutes < 60) return `${minutes} daqiqa oldin`
  const key = toDateKey(date)
  const today = toDateKey(now)
  if (key === today) return `${Math.floor(minutes / 60)} soat oldin`
  if (key === addDays(today, -1)) return `Kecha, ${timeOf(date)}`
  return formatDateTime(iso)
}

/** Sana bo'lagi uchun sarlavha: Bugun | Kecha | 12-may 2025, Dushanba */
export function formatDayHeading(key: DateKey, today: DateKey): string {
  if (key === today) return 'Bugun'
  if (key === addDays(today, -1)) return 'Kecha'
  return formatDateWithWeekday(key)
}
