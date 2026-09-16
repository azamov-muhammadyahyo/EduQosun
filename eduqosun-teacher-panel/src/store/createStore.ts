import { useSyncExternalStore } from 'react'

export type Updater<T> = T | ((previous: T) => T)

export interface Store<T> {
  getState: () => T
  setState: (updater: Updater<T>) => void
  subscribe: (listener: () => void) => () => void
}

/**
 * Juda yengil tashqi store (zustand g'oyasi asosida).
 * Komponentlar faqat o'zi tanlagan bo'lak o'zgarganda qayta chiziladi.
 */
export function createStore<T>(initialState: T): Store<T> {
  let state = initialState
  const listeners = new Set<() => void>()

  return {
    getState: () => state,
    setState: (updater) => {
      const next = typeof updater === 'function' ? (updater as (previous: T) => T)(state) : updater
      if (Object.is(next, state)) return
      state = next
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

/**
 * Store'dan bo'lak tanlash.
 * MUHIM: selector har chaqiruvda bir xil havolani qaytarishi kerak (masalan, `s => s.groups`).
 * Hisoblangan ma'lumotlar uchun `createSelector` yoki komponent ichida `useMemo` ishlating.
 */
export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  )
}

/**
 * Kirish qiymatlari o'zgarmaguncha natijani keshlaydigan selector (reselect g'oyasi).
 * Natija havolasi barqaror bo'lgani uchun `useStore` bilan xavfsiz ishlatiladi.
 */
export function createSelector<T, A, R>(input: (state: T) => A, compute: (a: A) => R): (state: T) => R
export function createSelector<T, A, B, R>(
  inputs: [(state: T) => A, (state: T) => B],
  compute: (a: A, b: B) => R,
): (state: T) => R
export function createSelector<T, A, B, C, R>(
  inputs: [(state: T) => A, (state: T) => B, (state: T) => C],
  compute: (a: A, b: B, c: C) => R,
): (state: T) => R
export function createSelector<T, A, B, C, D, R>(
  inputs: [(state: T) => A, (state: T) => B, (state: T) => C, (state: T) => D],
  compute: (a: A, b: B, c: C, d: D) => R,
): (state: T) => R
export function createSelector<T, A, B, C, D, E, R>(
  inputs: [(state: T) => A, (state: T) => B, (state: T) => C, (state: T) => D, (state: T) => E],
  compute: (a: A, b: B, c: C, d: D, e: E) => R,
): (state: T) => R
export function createSelector<T>(
  inputs: ((state: T) => unknown) | ((state: T) => unknown)[],
  compute: (...args: never[]) => unknown,
): (state: T) => unknown {
  const selectors = Array.isArray(inputs) ? inputs : [inputs]
  let lastArgs: unknown[] | null = null
  let lastResult: unknown

  return (state: T) => {
    const args = selectors.map((select) => select(state))
    if (lastArgs && args.every((arg, index) => Object.is(arg, lastArgs?.[index]))) {
      return lastResult
    }
    lastArgs = args
    lastResult = (compute as (...values: unknown[]) => unknown)(...args)
    return lastResult
  }
}
