/** Qiymatni [min, max] oralig'ida ushlaydi */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Ulush foizda (butun son); total 0 bo'lsa 0 */
export function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

export function average(values: readonly number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** 1234567 → "1 234 567" */
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/** O'rtacha baho: 8.46 → "8.5", yo'q bo'lsa "—" */
export function formatScore(value: number | null): string {
  return value === null ? '—' : round1(value).toFixed(1)
}

/** O'zgarish belgisi bilan: +5 / −3 / 0 */
export function formatSigned(value: number, suffix = ''): string {
  if (value > 0) return `+${value}${suffix}`
  if (value < 0) return `−${Math.abs(value)}${suffix}`
  return `0${suffix}`
}

/** Faqat raqamlar: "+998 (90) 123-45-67" → "998901234567" */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/** "901234567" yoki "998901234567" → "+998 90 123 45 67" */
export function formatPhone(value: string): string {
  let digits = digitsOnly(value)
  if (digits.length === 9) digits = `998${digits}`
  if (digits.length !== 12) return value.trim()
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`
}

/** tel: havolasi uchun */
export function phoneHref(value: string): string {
  const digits = digitsOnly(value)
  return `tel:+${digits.length === 9 ? `998${digits}` : digits}`
}

export function isValidPhone(value: string): boolean {
  const digits = digitsOnly(value)
  return digits.length === 9 || (digits.length === 12 && digits.startsWith('998'))
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

/** Hajmni o'qiladigan ko'rinishda: 2048 → "2.0 KB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
