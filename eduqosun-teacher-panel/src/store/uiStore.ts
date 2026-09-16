import type { ConfirmOptions, DrawerState, ModalState, TimerState } from '../types'
import { createStore, useStore } from './createStore'

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

export interface UIState {
  modal: ModalState | null
  drawer: DrawerState | null
  paletteOpen: boolean
  sidebarOpen: boolean
  confirm: ConfirmRequest | null
  timer: TimerState
}

export const idleTimer: TimerState = {
  status: 'idle',
  durationSec: 5 * 60,
  endsAt: null,
  remainingSec: 5 * 60,
  label: '',
}

export const uiStore = createStore<UIState>({
  modal: null,
  drawer: null,
  paletteOpen: false,
  sidebarOpen: false,
  confirm: null,
  timer: idleTimer,
})

export function useUI<S>(selector: (state: UIState) => S): S {
  return useStore(uiStore, selector)
}

const patch = (partial: Partial<UIState>) => uiStore.setState((state) => ({ ...state, ...partial }))

/* ———————————— Modal va panellar ———————————— */

export function openModal(modal: ModalState): void {
  patch({ modal, paletteOpen: false })
}

export function closeModal(): void {
  patch({ modal: null })
}

export function openDrawer(drawer: DrawerState): void {
  patch({ drawer, paletteOpen: false, sidebarOpen: false })
}

export function closeDrawer(): void {
  patch({ drawer: null })
}

export function openPalette(): void {
  patch({ paletteOpen: true })
}

export function closePalette(): void {
  patch({ paletteOpen: false })
}

export function setSidebarOpen(open: boolean): void {
  patch({ sidebarOpen: open })
}

/** Tasdiqlash oynasi: `if (await confirmAction({...})) { ... }` */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    uiStore.getState().confirm?.resolve(false)
    patch({ confirm: { ...options, resolve } })
  })
}

export function resolveConfirm(confirmed: boolean): void {
  const request = uiStore.getState().confirm
  if (!request) return
  patch({ confirm: null })
  request.resolve(confirmed)
}

/* ———————————— Dars taymeri ———————————— */

const setTimer = (timer: TimerState) => patch({ timer })

export function startTimer(durationSec: number, label = ''): void {
  setTimer({
    status: 'running',
    durationSec,
    endsAt: Date.now() + durationSec * 1000,
    remainingSec: durationSec,
    label,
  })
}

export function pauseTimer(): void {
  const { timer } = uiStore.getState()
  if (timer.status !== 'running' || timer.endsAt === null) return
  setTimer({ ...timer, status: 'paused', endsAt: null, remainingSec: Math.max(0, (timer.endsAt - Date.now()) / 1000) })
}

export function resumeTimer(): void {
  const { timer } = uiStore.getState()
  if (timer.status !== 'paused') return
  setTimer({ ...timer, status: 'running', endsAt: Date.now() + timer.remainingSec * 1000 })
}

export function addTimerSeconds(seconds: number): void {
  const { timer } = uiStore.getState()
  if (timer.status === 'running' && timer.endsAt !== null) {
    setTimer({ ...timer, durationSec: timer.durationSec + seconds, endsAt: timer.endsAt + seconds * 1000 })
  } else if (timer.status === 'paused') {
    setTimer({ ...timer, durationSec: timer.durationSec + seconds, remainingSec: timer.remainingSec + seconds })
  }
}

export function finishTimer(): void {
  const { timer } = uiStore.getState()
  setTimer({ ...timer, status: 'done', endsAt: null, remainingSec: 0 })
}

export function resetTimer(): void {
  const { timer } = uiStore.getState()
  setTimer({ ...idleTimer, durationSec: timer.durationSec, remainingSec: timer.durationSec })
}

/** Qolgan soniyalar (joriy holat uchun) */
export function timerRemaining(timer: TimerState, now: number): number {
  if (timer.status === 'running' && timer.endsAt !== null) return Math.max(0, (timer.endsAt - now) / 1000)
  if (timer.status === 'paused') return timer.remainingSec
  if (timer.status === 'done') return 0
  return timer.durationSec
}
