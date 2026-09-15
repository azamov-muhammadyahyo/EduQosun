import type { LucideIcon } from 'lucide-react'

/** Ikonka konteynerlari va belgilar uchun rang kalitlari */
export type AccentColor = 'blue' | 'green' | 'violet' | 'amber' | 'rose' | 'sky' | 'orange' | 'slate'

/** Sidebar navigatsiya elementi */
export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
}

/** Yuqoridagi statistika kartochkasi */
export interface Stat {
  id: string
  label: string
  value: string
  change: string
  /** o'sish (yashil, strelkali) yoki oddiy (kulrang) ko'rsatkich */
  changeTone: 'up' | 'muted'
  icon: LucideIcon
  color: AccentColor
}

/** Dars holati: o'tkazildi | hozir (faol) | rejalashtirilgan */
export type LessonStatus = 'held' | 'now' | 'planned'

/** Bugungi dars jadvali qatori */
export interface ScheduleLesson {
  id: string
  timeStart: string
  timeEnd: string
  title: string
  group: string
  status: LessonStatus
  /** Fan qisqartmasi (JS, HTML...) — ba'zi ro'yxatlarda ishlatiladi */
  badge?: string
  color?: AccentColor
}

/** Tezkor amal (Quick action) */
export interface QuickAction {
  id: string
  title: string
  description: string
  icon: LucideIcon
  color: AccentColor
}

/** Guruh sinf toifasi */
export type GradeCategory = 'grade-11' | 'grade-10' | 'other'

/** Guruh (Guruhlarim) */
export interface Group {
  id: string
  name: string
  subject: string
  studentCount: number
  activity: string
  grade: GradeCategory
  color: AccentColor
}

/** Guruh filtr "chip"i */
export interface GroupFilter {
  id: GradeCategory | 'all'
  label: string
  count: number
}

/** Xabar */
export interface Message {
  id: string
  name: string
  /** ism yonidagi qo'shimcha (masalan, guruh); bo'sh bo'lishi mumkin */
  meta: string
  preview: string
  time: string
  color: AccentColor
}

/** Oxirgi dars qatori */
export interface RecentLesson {
  id: string
  date: string
  timeStart: string
  timeEnd: string
  group: string
  topic: string
  status: LessonStatus
  /** Fan qisqartmasi kvadratchasi (JS, HTML, PY...) */
  badge: string
  color: AccentColor
}

/** Keyingi vazifa */
export interface UpcomingTask {
  id: string
  group: string
  subject: string
  description: string
  due: string
  color: AccentColor
}

/** So'nggi faoliyat oqimi elementi */
export interface ActivityItem {
  id: string
  /** Harakatni bajargan shaxs — qalin yoziladi; bo'lmasa faqat matn ko'rsatiladi */
  actor?: string
  text: string
  datetime: string
  icon: LucideIcon
  color: AccentColor
}

/** O'quvchilar faoliyati grafigidagi bitta kun */
export interface ActivityChartPoint {
  day: string
  /** Dars qatnashuvi */
  attendance: number
  /** Topshiriqlar */
  tasks: number
}

/** Grafik ostidagi mini statistika */
export interface MiniStat {
  id: string
  label: string
  value: string
  change: string
}

/** Kun taqvimi ma'lumoti */
export interface CalendarInfo {
  year: number
  /** 0-indeksli oy (0 = Yanvar, 4 = May) */
  month: number
  monthLabel: string
  activeDay: number
  weekdays: string[]
  summaryTitle: string
  summarySubtitle: string
}

/** O'qituvchi profili va salomlashuv bloki */
export interface TeacherProfile {
  fullName: string
  role: string
  initials: string
  greeting: string
  subtitle: string
  dateLabel: string
}

/* ————————————————————————————————————————————
   Darslarim sahifasi (Lessons page) tiplari
   ———————————————————————————————————————————— */

/** Darslar ro'yxati holati: O'tkazildi | Faol | Tugallandi */
export type LessonListStatus = 'held' | 'active' | 'completed'

/** Darslar ro'yxati qatori */
export interface LessonListItem {
  id: string
  index: number
  title: string
  group: string
  /** Fan: Dasturlash | Veb texnologiyalar */
  subject: string
  date: string
  timeStart: string
  timeEnd: string
  studentCount: number
  status: LessonListStatus
  /** Fan qisqartmasi kvadratchasi (JS, HTML, PY...) */
  badge: string
  color: AccentColor
}

/** Darslar ro'yxati filtri (tab) */
export interface LessonListFilter {
  id: 'all' | LessonListStatus
  label: string
}

/** Doiraviy (donut) grafik ulushi */
export interface DonutStat {
  id: LessonListStatus
  label: string
  value: number
  percent: number
  color: AccentColor
}

/** Tezkor tugma (Darslarim sahifasi) */
export interface QuickButton {
  id: string
  label: string
  icon: LucideIcon
  color: AccentColor
}
