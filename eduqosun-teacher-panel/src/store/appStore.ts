import { createSeedState } from '../data/seed'
import { readJson, removeStorage, writeStorage } from '../lib/storage'
import { STATE_VERSION, STORAGE_KEY, defaultSettings, type AppState } from './appState'
import { createStore, useStore } from './createStore'

/** Saqlangan qiymat bizning sxemaga mos keladimi (eski versiya yoki buzilgan JSON bo'lsa — yo'q) */
export function isValidState(value: unknown): value is AppState {
  if (typeof value !== 'object' || value === null) return false
  const state = value as Partial<AppState>
  return (
    state.version === STATE_VERSION &&
    Array.isArray(state.groups) &&
    Array.isArray(state.students) &&
    typeof state.attendance === 'object' &&
    typeof state.profile === 'object' &&
    typeof state.session === 'object'
  )
}

/** Yangi versiyada qo'shilgan sozlamalar eski saqlangan holatda ham bo'lsin */
function withDefaults(state: AppState): AppState {
  return { ...state, settings: { ...defaultSettings, ...state.settings } }
}

function loadInitialState(): AppState {
  const stored = readJson<unknown>(STORAGE_KEY)
  if (isValidState(stored)) return withDefaults(stored)
  const seed = createSeedState()
  writeStorage(STORAGE_KEY, JSON.stringify(seed))
  return seed
}

export const appStore = createStore<AppState>(loadInitialState())

/* ———————————— localStorage bilan sinxronlash ———————————— */

let persistTimer: number | undefined
let skipNextPersist = false
let storageFailed = false

function persistNow(): void {
  window.clearTimeout(persistTimer)
  persistTimer = undefined
  const ok = writeStorage(STORAGE_KEY, JSON.stringify(appStore.getState()))
  if (!ok && !storageFailed) {
    storageFailed = true
    console.warn("EduQosun: ma'lumotlarni brauzer xotirasiga saqlab bo'lmadi")
  }
}

appStore.subscribe(() => {
  if (skipNextPersist) {
    skipNextPersist = false
    return
  }
  window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(persistNow, 250)
})

if (typeof window !== 'undefined') {
  // Sahifa yopilayotganda kutib turgan o'zgarishlarni darhol yozamiz
  window.addEventListener('pagehide', () => {
    if (persistTimer !== undefined) persistNow()
  })

  // Boshqa oynada o'zgartirilgan ma'lumotni shu oynaga ham qo'llaymiz
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    try {
      const next: unknown = JSON.parse(event.newValue)
      if (isValidState(next)) {
        skipNextPersist = true
        appStore.setState(withDefaults(next))
      }
    } catch {
      /* buzilgan qiymat — e'tiborsiz */
    }
  })
}

/* ———————————— Ommaviy API ———————————— */

/**
 * Store'dan bo'lak tanlash hook'i.
 * Selector mavjud havolani qaytarishi kerak (`s => s.groups`); hisob-kitob uchun `useMemo`.
 */
export function useApp<S>(selector: (state: AppState) => S): S {
  return useStore(appStore, selector)
}

export function getAppState(): AppState {
  return appStore.getState()
}

export function updateApp(recipe: (state: AppState) => AppState): void {
  appStore.setState(recipe)
}

/** Butun holatni almashtiradi (import yoki "qaytarish" uchun) */
export function replaceAppState(next: AppState): void {
  appStore.setState(withDefaults(next))
  persistNow()
}

/** Demo ma'lumotlarni boshidan yaratadi (sessiya saqlanib qoladi) */
export function resetAppState(): void {
  const session = appStore.getState().session
  appStore.setState({ ...createSeedState(), session })
  persistNow()
}

export function clearStoredState(): void {
  removeStorage(STORAGE_KEY)
}
