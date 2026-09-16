import type { AccentColor, DateKey, TimeString, Weekday } from './common'

/*
 * Domen modeli. Barcha tiplar JSON'ga aylantiriladigan bo'lishi shart —
 * ular localStorage'da saqlanadi (funksiya, ikonka komponenti va h.k. yo'q).
 */

/* ———————————————————————— O'qituvchi ———————————————————————— */

export interface TeacherProfile {
  firstName: string
  lastName: string
  phone: string
  email: string
  bio: string
  subjects: string[]
  experienceYears: number
  color: AccentColor
  centerName: string
}

/* ———————————————————————— Guruhlar ———————————————————————— */

export type GroupStatus = 'active' | 'completed'

export type GroupIconKey =
  | 'code'
  | 'globe'
  | 'js'
  | 'react'
  | 'node'
  | 'python'
  | 'html'
  | 'figma'
  | 'cpu'
  | 'database'

/** Dars turi: amaliy | nazariy | nazariy + amaliy */
export type LessonKind = 'practice' | 'theory' | 'mixed'

/** Guruhning haftalik jadvalidagi bitta dars */
export interface ScheduleSlot {
  day: Weekday
  start: TimeString
  end: TimeString
  kind: LessonKind
}

export interface Group {
  id: string
  /** Qisqa nom: "11-A" */
  name: string
  /** Kurs nomi: "Frontend Foundation" */
  course: string
  /** Yo'nalish: "Dasturlash" */
  direction: string
  /** Asosiy fan: "JavaScript" */
  subject: string
  /** Guruh kodi: "FT-001" */
  code: string
  /** Qisqa tavsif (guruh kartasi sarlavhasida) */
  tagline: string
  /** Batafsil ma'lumot ("Guruh haqida") */
  description: string
  color: AccentColor
  icon: GroupIconKey
  status: GroupStatus
  /** ISO vaqt — guruh tizimda yaratilgan payt */
  createdAt: string
  /** Birinchi dars kuni */
  startDate: DateKey
  /** Kurs tugash sanasi (ixtiyoriy) */
  endDate?: DateKey
  room: string
  schedule: ScheduleSlot[]
  /** Mavzular ketma-ketligi — N-dars mavzusi shu ro'yxatdan olinadi */
  curriculum: string[]
}

/* ———————————————————————— O'quvchilar ———————————————————————— */

/** O'qiyotgan | Guruhdan chiqqan | Boshqa guruhga o'tgan | Kursni bitirgan */
export type StudentStatus = 'active' | 'left' | 'transferred' | 'graduated'

export type Gender = 'male' | 'female'

export interface Student {
  id: string
  firstName: string
  lastName: string
  gender: Gender
  groupId: string
  status: StudentStatus
  phone: string
  parentName: string
  parentPhone: string
  birthDate: DateKey
  joinedAt: DateKey
  /** Guruhdan chiqqan/o'tgan sana */
  leftAt?: DateKey
  transferredToGroupId?: string
  transferredFromGroupId?: string
  color: AccentColor
  /** O'qituvchining shaxsiy izohi */
  note: string
}

/* ———————————————————————— Darslar ———————————————————————— */

/** Jadvaldan hosil bo'lgan darsga kiritilgan o'zgarishlar */
export interface LessonOverride {
  canceled?: boolean
  topic?: string
  notes?: string
  homework?: string
  start?: TimeString
  end?: TimeString
  room?: string
}

/** Jadvaldan tashqari qo'shilgan (bir martalik) dars */
export interface ExtraLesson {
  id: string
  groupId: string
  date: DateKey
  start: TimeString
  end: TimeString
  topic: string
  kind: LessonKind
  room: string
  notes: string
  homework: string
  canceled: boolean
}

/** Ekranda ko'rsatiladigan dars (jadval + o'zgarishlar birlashtirilgan) */
export interface Lesson {
  /** Barqaror kalit: davomat va o'zgarishlar shu kalit bilan saqlanadi */
  key: string
  groupId: string
  date: DateKey
  start: TimeString
  end: TimeString
  topic: string
  kind: LessonKind
  room: string
  /** Kurs bo'yicha tartib raqami (bir martalik darslarda yo'q) */
  number: number | null
  canceled: boolean
  notes: string
  homework: string
  isExtra: boolean
}

/** O'tkazildi | Hozir | Bugun keyinroq | Kelgusi kunda | Bekor qilingan */
export type LessonPhase = 'held' | 'live' | 'upcoming' | 'planned' | 'canceled'

/* ———————————————————————— Davomat ———————————————————————— */

/** Keldi | Kechikdi | Kelmadi | Sababli */
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused'

export interface AttendanceMark {
  status: AttendanceStatus
  /** Uy vazifasi bajarilganmi (belgilanmagan bo'lishi mumkin) */
  homework?: boolean
}

/** Bitta darsdagi davomat: o'quvchi ID → belgi */
export type LessonAttendance = Record<string, AttendanceMark>

/* ———————————————————————— Baholar ———————————————————————— */

/** Darsdagi faollik | Og'zaki so'rov | Nazorat ishi | Imtihon */
export type AssessmentType = 'classwork' | 'oral' | 'quiz' | 'exam'

/** Baholar jurnalidagi qo'lda qo'shilgan ustun */
export interface Assessment {
  id: string
  groupId: string
  title: string
  type: AssessmentType
  date: DateKey
}

/* ———————————————————————— Topshiriqlar ———————————————————————— */

export type AssignmentStatus = 'active' | 'closed'

export interface Assignment {
  id: string
  groupId: string
  title: string
  description: string
  createdAt: string
  dueDate: DateKey
  dueTime: TimeString
  maxScore: number
  status: AssignmentStatus
}

export interface Submission {
  studentId: string
  submittedAt: string
  answer: string
  score?: number
  feedback?: string
  gradedAt?: string
}

/* ———————————————————————— Testlar ———————————————————————— */

export type TestStatus = 'draft' | 'published' | 'finished'

export interface TestQuestion {
  id: string
  text: string
  options: string[]
  /** To'g'ri javob indeksi */
  correct: number
}

export interface TestResult {
  studentId: string
  /** Har bir savolga berilgan javob indeksi (-1 = javobsiz) */
  answers: number[]
  finishedAt: string
  durationSec: number
}

export interface Test {
  id: string
  title: string
  description: string
  groupId: string
  durationMin: number
  status: TestStatus
  createdAt: string
  /** O'tkaziladigan sana */
  date: DateKey
  questions: TestQuestion[]
  results: TestResult[]
}

/* ———————————————————————— Xabarlar ———————————————————————— */

export type ConversationKind = 'student' | 'parent' | 'group'

export interface ChatMessage {
  id: string
  from: 'me' | 'them'
  /** Guruh suhbatida xabar muallifi */
  author?: string
  text: string
  sentAt: string
  /** Mening xabarim qabul qiluvchi tomonidan o'qilganmi */
  read: boolean
}

export interface Conversation {
  id: string
  kind: ConversationKind
  studentId?: string
  groupId?: string
  title: string
  subtitle: string
  color: AccentColor
  pinned: boolean
  unread: number
  messages: ChatMessage[]
}

/* ———————————————————————— Eslatmalar ———————————————————————— */

export type ReminderPriority = 'high' | 'medium' | 'low'

export type ReminderCategory = 'lesson' | 'group' | 'meeting' | 'personal'

export interface Reminder {
  id: string
  title: string
  note: string
  date: DateKey
  time?: TimeString
  priority: ReminderPriority
  category: ReminderCategory
  groupId?: string
  done: boolean
  doneAt?: string
  createdAt: string
  /** Muddat yaqinlashganda bildirishnoma yuborilganmi */
  notified?: boolean
}

/* ———————————————————————— Bildirishnomalar va faoliyat ———————————————————————— */

export type NotificationKind = 'message' | 'submission' | 'reminder' | 'attendance' | 'lesson' | 'system'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  text: string
  createdAt: string
  read: boolean
  /** Bosilganda o'tiladigan manzil (masalan, "messages/c1") */
  route?: string
}

export type ActivityKind =
  | 'submission'
  | 'lesson'
  | 'message'
  | 'grade'
  | 'student'
  | 'group'
  | 'assignment'
  | 'test'
  | 'attendance'
  | 'reminder'

export interface ActivityEntry {
  id: string
  kind: ActivityKind
  /** Harakatni bajargan shaxs — qalin yoziladi */
  actor?: string
  text: string
  createdAt: string
}

/* ———————————————————————— Sozlamalar va seans ———————————————————————— */

export interface AppSettings {
  notifyMessages: boolean
  notifySubmissions: boolean
  notifyReminders: boolean
  lessonReminder: boolean
  lessonReminderMinutes: number
  sound: boolean
  weeklyReport: boolean
  reduceMotion: boolean
  defaultLessonMinutes: number
  showPromo: boolean
}

export interface SessionState {
  loggedIn: boolean
  login: string
  /** Parolning SHA-256 xeshi (ochiq matn saqlanmaydi) */
  passwordHash: string
  lastLoginAt: string
  passwordChangedAt?: string
}
