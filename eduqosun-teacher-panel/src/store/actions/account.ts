import type { AppSettings, TeacherProfile } from '../../types'
import { hashPassword } from '../../lib/hash'
import { digitsOnly } from '../../lib/format'
import { DEFAULT_PASSWORD, type AppState } from '../appState'
import { getAppState, isValidState, replaceAppState, resetAppState, updateApp } from '../appStore'

export function updateProfile(patch: Partial<TeacherProfile>): void {
  updateApp((state) => ({ ...state, profile: { ...state.profile, ...patch } }))
}

export function updateSettings(patch: Partial<AppSettings>): void {
  updateApp((state) => ({ ...state, settings: { ...state.settings, ...patch } }))
}

async function currentPasswordHash(): Promise<string> {
  const stored = getAppState().session.passwordHash
  return stored || hashPassword(DEFAULT_PASSWORD)
}

function sameLogin(a: string, b: string): boolean {
  const da = digitsOnly(a)
  const db = digitsOnly(b)
  if (da && db) return da.slice(-9) === db.slice(-9)
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/** Kirish: login sifatida telefon raqami yoki e-pochta qabul qilinadi */
export async function login(loginValue: string, password: string): Promise<boolean> {
  const { session, profile } = getAppState()
  const loginOk = sameLogin(loginValue, session.login) || sameLogin(loginValue, profile.email)
  const passwordOk = (await hashPassword(password)) === (await currentPasswordHash())
  if (!loginOk || !passwordOk) return false
  updateApp((state) => ({
    ...state,
    session: { ...state.session, loggedIn: true, lastLoginAt: new Date().toISOString() },
  }))
  return true
}

export function logout(): void {
  updateApp((state) => ({ ...state, session: { ...state.session, loggedIn: false } }))
}

export async function changePassword(current: string, next: string): Promise<boolean> {
  if ((await hashPassword(current)) !== (await currentPasswordHash())) return false
  const passwordHash = await hashPassword(next)
  updateApp((state) => ({
    ...state,
    session: { ...state.session, passwordHash, passwordChangedAt: new Date().toISOString() },
  }))
  return true
}

export function exportData(): string {
  return JSON.stringify(getAppState(), null, 2)
}

/** JSON faylidan tiklash; noto'g'ri fayl bo'lsa false */
export function importData(json: string): boolean {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!isValidState(parsed)) return false
    const session = getAppState().session
    replaceAppState({ ...(parsed as AppState), session })
    return true
  } catch {
    return false
  }
}

export function resetDemoData(): void {
  resetAppState()
}

/** "Qaytarish" (undo) uchun: holatni oldingi nusxaga qaytaradi */
export function restoreSnapshot(snapshot: AppState): void {
  replaceAppState(snapshot)
}
