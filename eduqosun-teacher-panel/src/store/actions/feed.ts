import type { ActivityEntry, ActivityKind, AppNotification, NotificationKind } from '../../types'
import { createId } from '../../lib/id'
import { playChime } from '../../lib/sound'
import { getAppState, updateApp } from '../appStore'

const MAX_ACTIVITY = 60
const MAX_NOTIFICATIONS = 40

/* ———————————— So'nggi faoliyat ———————————— */

export function logActivity(kind: ActivityKind, text: string, actor?: string): void {
  const entry: ActivityEntry = { id: createId('act'), kind, text, actor, createdAt: new Date().toISOString() }
  updateApp((state) => ({ ...state, activity: [entry, ...state.activity].slice(0, MAX_ACTIVITY) }))
}

export function clearActivity(): void {
  updateApp((state) => ({ ...state, activity: [] }))
}

/* ———————————— Bildirishnomalar ———————————— */

export interface NotificationInput {
  kind: NotificationKind
  title: string
  text: string
  route?: string
}

export function pushNotification(input: NotificationInput, options: { sound?: boolean } = {}): void {
  const item: AppNotification = {
    id: createId('ntf'),
    ...input,
    createdAt: new Date().toISOString(),
    read: false,
  }
  updateApp((state) => ({ ...state, notifications: [item, ...state.notifications].slice(0, MAX_NOTIFICATIONS) }))
  if (options.sound !== false && getAppState().settings.sound) playChime('notify')
}

export function markNotificationRead(id: string): void {
  updateApp((state) => ({
    ...state,
    notifications: state.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
  }))
}

export function markAllNotificationsRead(): void {
  updateApp((state) => ({
    ...state,
    notifications: state.notifications.map((item) => (item.read ? item : { ...item, read: true })),
  }))
}

export function removeNotification(id: string): void {
  updateApp((state) => ({ ...state, notifications: state.notifications.filter((item) => item.id !== id) }))
}

export function clearNotifications(): void {
  updateApp((state) => ({ ...state, notifications: [] }))
}
