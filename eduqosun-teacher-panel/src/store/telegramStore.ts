import type { AccountDTO, AuthState } from '../api/types'
import { createStore, useStore } from './createStore'

/*
 * Telegram ulanishining vaqtinchalik holati (localStorage'ga yozilmaydi):
 * server holati, akkaunt va yuborilayotgan xabarlarning foizi.
 */

/** Tekshirilmoqda | Ishlayapti | O'chiq */
export type ServerState = 'checking' | 'online' | 'offline'

export interface TelegramState {
  server: ServerState
  /** .env da TG_API_ID/TG_API_HASH bor */
  configured: boolean
  auth: AuthState
  account: AccountDTO | null
  /** Kirish jarayoni ma'lumotlari */
  phone: string | null
  codeVia: 'app' | 'sms' | null
  passwordHint: string | null
  maxUploadBytes: number
  /** Yuborilayotgan xabar (clientId) → 0…1 */
  progress: Record<string, number>
}

export const telegramStore = createStore<TelegramState>({
  server: 'checking',
  configured: false,
  auth: 'disconnected',
  account: null,
  phone: null,
  codeVia: null,
  passwordHint: null,
  maxUploadBytes: 2000 * 1024 * 1024,
  progress: {},
})

export function useTelegram<S>(selector: (state: TelegramState) => S): S {
  return useStore(telegramStore, selector)
}

export function patchTelegram(partial: Partial<TelegramState>): void {
  telegramStore.setState((state) => ({ ...state, ...partial }))
}

export function setProgress(clientId: string, value: number | null): void {
  telegramStore.setState((state) => {
    const progress = { ...state.progress }
    if (value === null) delete progress[clientId]
    else progress[clientId] = value
    return { ...state, progress }
  })
}

/** Telegram orqali yozish mumkinmi */
export const selectTelegramReady = (state: TelegramState) => state.server === 'online' && state.auth === 'connected'
