/*
 * localStorage uchun xavfsiz o'ramlar: maxfiy rejim, to'lib qolgan xotira yoki
 * o'chirilgan saqlash joyida ilova qulab tushmasligi kerak.
 */

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* e'tiborsiz */
  }
}

export function readJson<T>(key: string): T | null {
  const raw = readStorage(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
