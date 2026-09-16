import type { ToastItem, ToastTone } from '../types'
import { createId } from '../lib/id'
import { createStore, useStore } from './createStore'

export const toastStore = createStore<ToastItem[]>([])

const MAX_TOASTS = 4

export interface ToastInput {
  tone?: ToastTone
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  durationMs?: number
}

export function toast(input: ToastInput): string {
  const id = createId('toast')
  const item: ToastItem = {
    id,
    tone: input.tone ?? 'success',
    title: input.title,
    description: input.description,
    actionLabel: input.actionLabel,
    onAction: input.onAction,
    // Amal tugmasi bo'lsa foydalanuvchiga ko'proq vaqt beramiz
    durationMs: input.durationMs ?? (input.actionLabel ? 7000 : 3800),
  }
  toastStore.setState((list) => [...list, item].slice(-MAX_TOASTS))
  return id
}

export function dismissToast(id: string): void {
  toastStore.setState((list) => list.filter((item) => item.id !== id))
}

export const notify = {
  success: (title: string, description?: string) => toast({ tone: 'success', title, description }),
  error: (title: string, description?: string) => toast({ tone: 'error', title, description }),
  info: (title: string, description?: string) => toast({ tone: 'info', title, description }),
  warning: (title: string, description?: string) => toast({ tone: 'warning', title, description }),
}

export function useToasts(): ToastItem[] {
  return useStore(toastStore, (list) => list)
}
