import type {
  ActivityEntry,
  AppNotification,
  AppSettings,
  Assessment,
  Assignment,
  Conversation,
  DateKey,
  ExtraLesson,
  Group,
  LessonAttendance,
  LessonOverride,
  Reminder,
  SessionState,
  Student,
  Submission,
  TeacherProfile,
  Test,
} from '../types'

/** Saqlangan ma'lumot sxemasi versiyasi — tuzilma o'zgarsa oshiriladi */
export const STATE_VERSION = 1

export const STORAGE_KEY = 'eduqosun-data'

/** Standart parol (seans xeshi bo'sh bo'lsa shu parol amal qiladi) */
export const DEFAULT_PASSWORD = 'demo1234'

export interface AppState {
  version: number
  /** Demo ma'lumotlar yaratilgan kun */
  seededOn: DateKey
  profile: TeacherProfile
  settings: AppSettings
  session: SessionState
  groups: Group[]
  students: Student[]
  lessonOverrides: Record<string, LessonOverride>
  extraLessons: ExtraLesson[]
  /** Dars kaliti → davomat */
  attendance: Record<string, LessonAttendance>
  assessments: Assessment[]
  /** Baholash ID → o'quvchi ID → baho (0–10) */
  grades: Record<string, Record<string, number>>
  assignments: Assignment[]
  /** Topshiriq ID → o'quvchi ID → javob */
  submissions: Record<string, Record<string, Submission>>
  tests: Test[]
  conversations: Conversation[]
  reminders: Reminder[]
  notifications: AppNotification[]
  activity: ActivityEntry[]
}

export const defaultSettings: AppSettings = {
  notifyMessages: true,
  notifySubmissions: true,
  notifyReminders: true,
  lessonReminder: true,
  lessonReminderMinutes: 10,
  sound: true,
  weeklyReport: false,
  reduceMotion: false,
  defaultLessonMinutes: 90,
  showPromo: true,
}
