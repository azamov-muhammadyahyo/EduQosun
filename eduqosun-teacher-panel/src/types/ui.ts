import type { LucideIcon } from 'lucide-react'
import type { DateKey } from './common'
import type { ConversationKind } from './domain'

/** Ilova sahifalari (hash-marshrut nomlari) */
export type PageId =
  | 'home'
  | 'lessons'
  | 'groups'
  | 'students'
  | 'grades'
  | 'attendance'
  | 'tasks'
  | 'tests'
  | 'messages'
  | 'reminders'
  | 'statistics'
  | 'settings'

/** Sidebar navigatsiya elementi */
export interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
}

/** Xabar yozish oynasi uchun oldindan tanlangan qabul qiluvchi */
export interface ComposeTarget {
  kind: ConversationKind
  /** student/parent → o'quvchi ID, group → guruh ID */
  id: string
}

/** Global modal oynalar */
export type ModalState =
  | { type: 'group-form'; groupId?: string }
  | { type: 'student-form'; studentId?: string; groupId?: string }
  | { type: 'student-transfer'; studentId: string }
  | { type: 'lesson-form'; lessonKey?: string; groupId?: string; date?: DateKey }
  | { type: 'assignment-form'; assignmentId?: string; groupId?: string }
  | { type: 'test-builder'; testId?: string; groupId?: string }
  | { type: 'test-preview'; testId: string }
  | { type: 'compose'; target?: ComposeTarget; text?: string }
  /** Telegram guruhi yoki o'quvchi bilan yangi suhbat (conversationId — mavjud suhbatni ulash) */
  | { type: 'new-chat'; kind?: ConversationKind; conversationId?: string }
  | { type: 'telegram-connect' }
  | { type: 'reminder-form'; reminderId?: string; date?: DateKey }
  | { type: 'assessment-form'; groupId: string; assessmentId?: string }
  | { type: 'random-picker'; groupId?: string }
  | { type: 'timer' }
  | { type: 'team-splitter'; groupId?: string }
  | { type: 'shortcuts' }
  | { type: 'activity-log' }

/** O'ng tomondan chiqadigan panellar */
export type DrawerState =
  | { type: 'lesson'; lessonKey: string }
  | { type: 'student'; studentId: string }
  | { type: 'group'; groupId: string }
  | { type: 'assignment-review'; assignmentId: string }
  | { type: 'test-results'; testId: string }

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  tone: ToastTone
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  durationMs: number
}

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
}

/** Dars taymeri holati */
export interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'done'
  /** Umumiy davomiylik, soniya */
  durationSec: number
  /** running holatida — tugash vaqti (epoch ms) */
  endsAt: number | null
  /** paused holatida — qolgan soniyalar */
  remainingSec: number
  label: string
}
