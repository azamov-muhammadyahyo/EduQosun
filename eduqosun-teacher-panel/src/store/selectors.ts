import type { AppNotification, Group, Student } from '../types'
import { buildGroupMetrics, buildStudentMetrics } from '../domain/analytics'
import type { LessonSources } from '../domain/lessons'
import type { AppState } from './appState'
import { createSelector } from './createStore'

/*
 * Keshlangan (memo) selectorlar: kirish bo'laklari o'zgarmaguncha bir xil havola qaytaradi,
 * shuning uchun `useApp(selector)` bilan xavfsiz ishlatiladi va og'ir hisob-kitob bir marta bajariladi.
 */

export const selectLessonSources = createSelector(
  [(s: AppState) => s.groups, (s: AppState) => s.lessonOverrides, (s: AppState) => s.extraLessons],
  (groups, overrides, extras): LessonSources => ({ groups, overrides, extras }),
)

export const selectGroupMap = createSelector(
  (s: AppState) => s.groups,
  (groups) => new Map<string, Group>(groups.map((g) => [g.id, g])),
)

export const selectStudentMap = createSelector(
  (s: AppState) => s.students,
  (students) => new Map<string, Student>(students.map((st) => [st.id, st])),
)

export const selectActiveGroups = createSelector(
  (s: AppState) => s.groups,
  (groups) => groups.filter((g) => g.status === 'active'),
)

const selectRecordInputs = createSelector(
  [
    (s: AppState) => s.students,
    (s: AppState) => s.attendance,
    (s: AppState) => s.extraLessons,
    (s: AppState) => s.assessments,
    (s: AppState) => s.grades,
  ],
  (students, attendance, extras, assessments, grades) => ({ students, attendance, extras, assessments, grades }),
)

const selectWorkInputs = createSelector(
  [(s: AppState) => s.assignments, (s: AppState) => s.submissions, (s: AppState) => s.tests],
  (assignments, submissions, tests) => ({ assignments, submissions, tests }),
)

export const selectStudentMetrics = createSelector([selectRecordInputs, selectWorkInputs], (records, work) =>
  buildStudentMetrics({ ...records, ...work, now: new Date() }),
)

export const selectGroupMetrics = createSelector(
  [
    (s: AppState) => s.groups,
    (s: AppState) => s.students,
    selectStudentMetrics,
    (s: AppState) => s.attendance,
    (s: AppState) => s.extraLessons,
  ],
  (groups, students, metrics, attendance, extras) => buildGroupMetrics(groups, students, metrics, attendance, extras),
)

/* Oddiy sonlar — keshsiz ham xavfsiz */

export const selectUnreadMessages = (s: AppState): number =>
  s.conversations.reduce((sum, conversation) => sum + conversation.unread, 0)

/** Sozlamalarda o'chirilgan turdagi bildirishnomalar ko'rsatilmaydi */
export const selectVisibleNotifications = createSelector(
  [(s: AppState) => s.notifications, (s: AppState) => s.settings.notifyMessages, (s: AppState) => s.settings.notifySubmissions],
  (notifications, messages, submissions): AppNotification[] =>
    notifications.filter((n) => (messages || n.kind !== 'message') && (submissions || n.kind !== 'submission')),
)

export const selectUnreadNotifications = (s: AppState): number => selectVisibleNotifications(s).filter((n) => !n.read).length

export const selectPendingReminders = (s: AppState): number => s.reminders.filter((r) => !r.done).length
