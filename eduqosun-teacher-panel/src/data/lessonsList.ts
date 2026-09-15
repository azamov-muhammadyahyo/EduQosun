import { ClipboardList, FileQuestion, GraduationCap, Users } from 'lucide-react'
import type { DonutStat, LessonListFilter, LessonListItem, QuickButton } from '../types'

/** "Darslar ro'yxati" ustidagi tab-filtrlar */
export const lessonListFilters: LessonListFilter[] = [
  { id: 'all', label: 'Barchasi' },
  { id: 'active', label: 'Faol' },
  { id: 'completed', label: 'Tugallangan' },
  { id: 'held', label: 'Arxiv' },
]

/** Darslar ro'yxati (Darslarim sahifasi) */
export const lessonsList: LessonListItem[] = [
  { id: 'l1', index: 1, title: 'JavaScript (Asosiy)', group: '11-A', subject: 'Dasturlash', date: '12.05.2025', timeStart: '08:30', timeEnd: '10:00', studentCount: 22, status: 'held', badge: 'JS', color: 'amber' },
  { id: 'l2', index: 2, title: 'HTML & CSS (Asosiy)', group: '11-B', subject: 'Veb texnologiyalar', date: '12.05.2025', timeStart: '10:20', timeEnd: '11:50', studentCount: 20, status: 'held', badge: 'HTML', color: 'orange' },
  { id: 'l3', index: 3, title: "Python (Boshlang'ich)", group: '10-A', subject: 'Dasturlash', date: '12.05.2025', timeStart: '12:10', timeEnd: '13:40', studentCount: 18, status: 'held', badge: 'PY', color: 'violet' },
  { id: 'l4', index: 4, title: 'Web Development', group: '11-A', subject: 'Veb texnologiyalar', date: '12.05.2025', timeStart: '15:00', timeEnd: '16:30', studentCount: 16, status: 'active', badge: 'WD', color: 'blue' },
  { id: 'l5', index: 5, title: 'JavaScript (Advanced)', group: '11-B', subject: 'Dasturlash', date: '13.05.2025', timeStart: '08:30', timeEnd: '10:00', studentCount: 19, status: 'completed', badge: 'JS', color: 'amber' },
  { id: 'l6', index: 6, title: 'CSS (Flex & Grid)', group: '10-A', subject: 'Veb texnologiyalar', date: '13.05.2025', timeStart: '10:20', timeEnd: '11:50', studentCount: 17, status: 'held', badge: 'CS', color: 'green' },
  { id: 'l7', index: 7, title: 'React (Asosiy)', group: '11-A', subject: 'Dasturlash', date: '13.05.2025', timeStart: '12:10', timeEnd: '13:40', studentCount: 15, status: 'active', badge: 'RE', color: 'violet' },
  { id: 'l8', index: 8, title: "TypeScript (Boshlang'ich)", group: '11-B', subject: 'Dasturlash', date: '13.05.2025', timeStart: '15:00', timeEnd: '16:30', studentCount: 14, status: 'completed', badge: 'TS', color: 'blue' },
  { id: 'l9', index: 9, title: 'Next.js (Asosiy)', group: '10-A', subject: 'Veb texnologiyalar', date: '14.05.2025', timeStart: '08:30', timeEnd: '10:00', studentCount: 12, status: 'held', badge: 'NX', color: 'rose' },
  { id: 'l10', index: 10, title: 'HTML & CSS (Amaliy)', group: '11-A', subject: 'Veb texnologiyalar', date: '14.05.2025', timeStart: '10:20', timeEnd: '11:50', studentCount: 18, status: 'active', badge: 'HT', color: 'violet' },
]

/** "Darslar bo'yicha statistika" doiraviy grafigi uchun ulushlar */
export const lessonDonutStats: DonutStat[] = [
  { id: 'held', label: "O'tkazildi", value: 9, percent: 75, color: 'green' },
  { id: 'active', label: 'Faol', value: 2, percent: 17, color: 'blue' },
  { id: 'completed', label: 'Tugallandi', value: 1, percent: 8, color: 'slate' },
]

/** Doiraviy grafik markazidagi umumiy son */
export const lessonTotalCount = 12

/** "Tezkor tugmalar" (Darslarim sahifasi) */
export const lessonQuickButtons: QuickButton[] = [
  { id: 'add-group', label: "Guruh qo'shish", icon: Users, color: 'blue' },
  { id: 'add-student', label: "O'quvchi qo'shish", icon: GraduationCap, color: 'green' },
  { id: 'tasks', label: 'Topshiriqlar', icon: ClipboardList, color: 'amber' },
  { id: 'tests', label: 'Testlar', icon: FileQuestion, color: 'violet' },
]
