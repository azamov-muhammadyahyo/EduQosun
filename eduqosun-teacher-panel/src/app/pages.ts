import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { PageId } from '../types'

/*
 * Har bir sahifa alohida bo'lakda yuklanadi (code splitting) —
 * birinchi ochilish tezlashadi, grafik kutubxonasi faqat kerak bo'lganda yuklanadi.
 */

type LazyPage = LazyExoticComponent<ComponentType>

function page<T extends Record<string, ComponentType>>(loader: () => Promise<T>, name: keyof T): LazyPage {
  return lazy(() => loader().then((module) => ({ default: module[name] })))
}

export const pages: Record<PageId, LazyPage> = {
  home: page(() => import('../pages/DashboardPage'), 'DashboardPage'),
  lessons: page(() => import('../pages/LessonsPage'), 'LessonsPage'),
  groups: page(() => import('../pages/GroupsPage'), 'GroupsPage'),
  students: page(() => import('../pages/StudentsPage'), 'StudentsPage'),
  grades: page(() => import('../pages/GradesPage'), 'GradesPage'),
  attendance: page(() => import('../pages/AttendancePage'), 'AttendancePage'),
  tasks: page(() => import('../pages/TasksPage'), 'TasksPage'),
  tests: page(() => import('../pages/TestsPage'), 'TestsPage'),
  messages: page(() => import('../pages/MessagesPage'), 'MessagesPage'),
  reminders: page(() => import('../pages/RemindersPage'), 'RemindersPage'),
  statistics: page(() => import('../pages/StatisticsPage'), 'StatisticsPage'),
  settings: page(() => import('../pages/SettingsPage'), 'SettingsPage'),
}
