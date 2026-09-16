import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { minutesOfDay, toDateKey } from '../lib/date'
import type { DateKey } from '../types'

/*
 * Umumiy soat: barcha "jonli" komponentlar (dars holati, qolgan vaqt) bitta taymerga obuna bo'ladi
 * va faqat daqiqa almashganda qayta chiziladi.
 */

let current = Date.now()
const listeners = new Set<() => void>()
let interval: number | undefined

const minuteOf = (ms: number) => Math.floor(ms / 60_000)

function tick(): void {
  const now = Date.now()
  if (minuteOf(now) === minuteOf(current)) return
  current = now
  listeners.forEach((listener) => listener())
}

function onVisibility(): void {
  if (document.visibilityState === 'visible') tick()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (listeners.size === 1) {
    current = Date.now()
    interval = window.setInterval(tick, 5_000)
    document.addEventListener('visibilitychange', onVisibility)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }
}

const getSnapshot = () => current

/** Joriy vaqt (daqiqa aniqligida yangilanadi) */
export function useNow(): Date {
  const timestamp = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return useMemo(() => new Date(timestamp), [timestamp])
}

export interface Clock {
  now: Date
  today: DateKey
  /** Kun boshidan beri o'tgan daqiqalar */
  minutes: number
}

export function useClock(): Clock {
  const now = useNow()
  return useMemo(() => ({ now, today: toDateKey(now), minutes: minutesOfDay(now) }), [now])
}

/** Soniya aniqligidagi taymer (faqat faol bo'lsa ishlaydi) */
export function useSecondTicker(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return undefined
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [active])
  return now
}
