import type { AccentColor } from '../types'

export interface AccentClasses {
  /** Ikonka konteyneri foni */
  iconBg: string
  /** Ikonka (matn) rangi */
  iconText: string
  /** Kartochka uchun yumshoq fon */
  softBg: string
  /** To'liq (kuchli) fon — masalan, chiziq yoki avatar uchun */
  solidBg: string
  /** Rangli kartochka uchun nozik ramka */
  softBorder: string
  /** Rangli fon ustidagi ikonka konteyneri (iconBg'dan to'qroq) */
  strongBg: string
  /** Guruh plitkalari uchun gradiyent */
  gradient: string
  /** Qator chap chegarasi */
  leftBorder: string
  /** Yumshoq belgi (badge): fon + matn + halqa */
  badge: string
  /** Tanlangan element halqasi */
  ring: string
  /** Rangli soya */
  shadow: string
  /** SVG to'ldirish */
  fill: string
  /** SVG chiziq */
  stroke: string
  /** HEX qiymati — recharts kabi Tailwind ishlamaydigan joylar uchun */
  hex: string
}

/**
 * Har bir accent rang uchun tayyor Tailwind sinflari.
 * Sinflar to'liq matn ko'rinishida yozilgan — shunda Tailwind JIT ularni to'g'ri aniqlaydi.
 */
export const accent: Record<AccentColor, AccentClasses> = {
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-500/15',
    iconText: 'text-blue-600 dark:text-blue-400',
    softBg: 'bg-blue-50/70 dark:bg-blue-500/10',
    solidBg: 'bg-blue-500',
    softBorder: 'border-blue-100 dark:border-blue-500/20',
    strongBg: 'bg-blue-100 dark:bg-blue-500/20',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    leftBorder: 'border-l-blue-500',
    badge: 'bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/25',
    ring: 'ring-blue-500',
    shadow: 'shadow-blue-500/25',
    fill: 'fill-blue-500',
    stroke: 'stroke-blue-500',
    hex: '#2563EB',
  },
  green: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/15',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    softBg: 'bg-emerald-50/70 dark:bg-emerald-500/10',
    solidBg: 'bg-emerald-500',
    softBorder: 'border-emerald-100 dark:border-emerald-500/20',
    strongBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    leftBorder: 'border-l-emerald-500',
    badge:
      'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25',
    ring: 'ring-emerald-500',
    shadow: 'shadow-emerald-500/25',
    fill: 'fill-emerald-500',
    stroke: 'stroke-emerald-500',
    hex: '#10B981',
  },
  violet: {
    iconBg: 'bg-violet-50 dark:bg-violet-500/15',
    iconText: 'text-violet-600 dark:text-violet-400',
    softBg: 'bg-violet-50/70 dark:bg-violet-500/10',
    solidBg: 'bg-violet-500',
    softBorder: 'border-violet-100 dark:border-violet-500/20',
    strongBg: 'bg-violet-100 dark:bg-violet-500/20',
    gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
    leftBorder: 'border-l-violet-500',
    badge:
      'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/25',
    ring: 'ring-violet-500',
    shadow: 'shadow-violet-500/25',
    fill: 'fill-violet-500',
    stroke: 'stroke-violet-500',
    hex: '#8B5CF6',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/15',
    iconText: 'text-amber-600 dark:text-amber-400',
    softBg: 'bg-amber-50/70 dark:bg-amber-500/10',
    solidBg: 'bg-amber-500',
    softBorder: 'border-amber-100 dark:border-amber-500/20',
    strongBg: 'bg-amber-100 dark:bg-amber-500/20',
    gradient: 'bg-gradient-to-br from-amber-400 to-amber-500',
    leftBorder: 'border-l-amber-500',
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25',
    ring: 'ring-amber-500',
    shadow: 'shadow-amber-500/25',
    fill: 'fill-amber-500',
    stroke: 'stroke-amber-500',
    hex: '#F59E0B',
  },
  rose: {
    iconBg: 'bg-rose-50 dark:bg-rose-500/15',
    iconText: 'text-rose-600 dark:text-rose-400',
    softBg: 'bg-rose-50/70 dark:bg-rose-500/10',
    solidBg: 'bg-rose-500',
    softBorder: 'border-rose-100 dark:border-rose-500/20',
    strongBg: 'bg-rose-100 dark:bg-rose-500/20',
    gradient: 'bg-gradient-to-br from-rose-500 to-rose-600',
    leftBorder: 'border-l-rose-500',
    badge: 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/25',
    ring: 'ring-rose-500',
    shadow: 'shadow-rose-500/25',
    fill: 'fill-rose-500',
    stroke: 'stroke-rose-500',
    hex: '#F43F5E',
  },
  sky: {
    iconBg: 'bg-sky-50 dark:bg-sky-500/15',
    iconText: 'text-sky-600 dark:text-sky-400',
    softBg: 'bg-sky-50/70 dark:bg-sky-500/10',
    solidBg: 'bg-sky-500',
    softBorder: 'border-sky-100 dark:border-sky-500/20',
    strongBg: 'bg-sky-100 dark:bg-sky-500/20',
    gradient: 'bg-gradient-to-br from-sky-400 to-cyan-500',
    leftBorder: 'border-l-sky-500',
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/25',
    ring: 'ring-sky-500',
    shadow: 'shadow-sky-500/25',
    fill: 'fill-sky-500',
    stroke: 'stroke-sky-500',
    hex: '#0EA5E9',
  },
  orange: {
    iconBg: 'bg-orange-50 dark:bg-orange-500/15',
    iconText: 'text-orange-600 dark:text-orange-400',
    softBg: 'bg-orange-50/70 dark:bg-orange-500/10',
    solidBg: 'bg-orange-500',
    softBorder: 'border-orange-100 dark:border-orange-500/20',
    strongBg: 'bg-orange-100 dark:bg-orange-500/20',
    gradient: 'bg-gradient-to-br from-orange-400 to-orange-500',
    leftBorder: 'border-l-orange-500',
    badge:
      'bg-orange-50 text-orange-700 ring-orange-600/15 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/25',
    ring: 'ring-orange-500',
    shadow: 'shadow-orange-500/25',
    fill: 'fill-orange-500',
    stroke: 'stroke-orange-500',
    hex: '#F97316',
  },
  slate: {
    iconBg: 'bg-slate-100 dark:bg-slate-700/50',
    iconText: 'text-slate-600 dark:text-slate-300',
    softBg: 'bg-slate-50/70 dark:bg-slate-700/20',
    solidBg: 'bg-slate-500',
    softBorder: 'border-slate-200 dark:border-slate-700/60',
    strongBg: 'bg-slate-200/70 dark:bg-slate-700/60',
    gradient: 'bg-gradient-to-br from-slate-400 to-slate-500',
    leftBorder: 'border-l-slate-400',
    badge: 'bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-700/50 dark:text-slate-300 dark:ring-slate-500/30',
    ring: 'ring-slate-400',
    shadow: 'shadow-slate-500/20',
    fill: 'fill-slate-400',
    stroke: 'stroke-slate-400',
    hex: '#64748B',
  },
  teal: {
    iconBg: 'bg-teal-50 dark:bg-teal-500/15',
    iconText: 'text-teal-600 dark:text-teal-400',
    softBg: 'bg-teal-50/70 dark:bg-teal-500/10',
    solidBg: 'bg-teal-500',
    softBorder: 'border-teal-100 dark:border-teal-500/20',
    strongBg: 'bg-teal-100 dark:bg-teal-500/20',
    gradient: 'bg-gradient-to-br from-teal-400 to-teal-600',
    leftBorder: 'border-l-teal-500',
    badge: 'bg-teal-50 text-teal-700 ring-teal-600/15 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/25',
    ring: 'ring-teal-500',
    shadow: 'shadow-teal-500/25',
    fill: 'fill-teal-500',
    stroke: 'stroke-teal-500',
    hex: '#14B8A6',
  },
  pink: {
    iconBg: 'bg-pink-50 dark:bg-pink-500/15',
    iconText: 'text-pink-600 dark:text-pink-400',
    softBg: 'bg-pink-50/70 dark:bg-pink-500/10',
    solidBg: 'bg-pink-500',
    softBorder: 'border-pink-100 dark:border-pink-500/20',
    strongBg: 'bg-pink-100 dark:bg-pink-500/20',
    gradient: 'bg-gradient-to-br from-pink-500 to-fuchsia-600',
    leftBorder: 'border-l-pink-500',
    badge: 'bg-pink-50 text-pink-700 ring-pink-600/15 dark:bg-pink-500/10 dark:text-pink-300 dark:ring-pink-400/25',
    ring: 'ring-pink-500',
    shadow: 'shadow-pink-500/25',
    fill: 'fill-pink-500',
    stroke: 'stroke-pink-500',
    hex: '#EC4899',
  },
  indigo: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/15',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    softBg: 'bg-indigo-50/70 dark:bg-indigo-500/10',
    solidBg: 'bg-indigo-500',
    softBorder: 'border-indigo-100 dark:border-indigo-500/20',
    strongBg: 'bg-indigo-100 dark:bg-indigo-500/20',
    gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    leftBorder: 'border-l-indigo-500',
    badge:
      'bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/25',
    ring: 'ring-indigo-500',
    shadow: 'shadow-indigo-500/25',
    fill: 'fill-indigo-500',
    stroke: 'stroke-indigo-500',
    hex: '#6366F1',
  },
}

/** Rang tanlagichlarda ko'rsatiladigan ranglar (kulrang — faqat tugagan guruhlar uchun) */
export const accentPalette: AccentColor[] = [
  'blue',
  'green',
  'violet',
  'amber',
  'pink',
  'teal',
  'sky',
  'indigo',
  'orange',
  'rose',
]

/** Holat ranglari: a'lo / yaxshi / o'rta / past / ma'lumot yo'q */
export type ToneColor = Extract<AccentColor, 'green' | 'blue' | 'amber' | 'rose' | 'slate'>

/** Baho (0–10) uchun rang */
export function scoreTone(score: number | null | undefined): ToneColor {
  if (score === null || score === undefined) return 'slate'
  if (score >= 9) return 'green'
  if (score >= 7) return 'blue'
  if (score >= 5) return 'amber'
  return 'rose'
}

/** Davomat foizi uchun rang */
export function rateTone(rate: number | null | undefined): ToneColor {
  if (rate === null || rate === undefined) return 'slate'
  if (rate >= 90) return 'green'
  if (rate >= 75) return 'blue'
  if (rate >= 60) return 'amber'
  return 'rose'
}
