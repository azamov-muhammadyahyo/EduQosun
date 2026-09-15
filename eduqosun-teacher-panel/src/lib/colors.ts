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
    hex: '#2563EB',
  },
  green: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/15',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    softBg: 'bg-emerald-50/70 dark:bg-emerald-500/10',
    solidBg: 'bg-emerald-500',
    softBorder: 'border-emerald-100 dark:border-emerald-500/20',
    strongBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    hex: '#10B981',
  },
  violet: {
    iconBg: 'bg-violet-50 dark:bg-violet-500/15',
    iconText: 'text-violet-600 dark:text-violet-400',
    softBg: 'bg-violet-50/70 dark:bg-violet-500/10',
    solidBg: 'bg-violet-500',
    softBorder: 'border-violet-100 dark:border-violet-500/20',
    strongBg: 'bg-violet-100 dark:bg-violet-500/20',
    hex: '#8B5CF6',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/15',
    iconText: 'text-amber-600 dark:text-amber-400',
    softBg: 'bg-amber-50/70 dark:bg-amber-500/10',
    solidBg: 'bg-amber-500',
    softBorder: 'border-amber-100 dark:border-amber-500/20',
    strongBg: 'bg-amber-100 dark:bg-amber-500/20',
    hex: '#F59E0B',
  },
  rose: {
    iconBg: 'bg-rose-50 dark:bg-rose-500/15',
    iconText: 'text-rose-600 dark:text-rose-400',
    softBg: 'bg-rose-50/70 dark:bg-rose-500/10',
    solidBg: 'bg-rose-500',
    softBorder: 'border-rose-100 dark:border-rose-500/20',
    strongBg: 'bg-rose-100 dark:bg-rose-500/20',
    hex: '#F43F5E',
  },
  sky: {
    iconBg: 'bg-sky-50 dark:bg-sky-500/15',
    iconText: 'text-sky-600 dark:text-sky-400',
    softBg: 'bg-sky-50/70 dark:bg-sky-500/10',
    solidBg: 'bg-sky-500',
    softBorder: 'border-sky-100 dark:border-sky-500/20',
    strongBg: 'bg-sky-100 dark:bg-sky-500/20',
    hex: '#0EA5E9',
  },
  orange: {
    iconBg: 'bg-orange-50 dark:bg-orange-500/15',
    iconText: 'text-orange-600 dark:text-orange-400',
    softBg: 'bg-orange-50/70 dark:bg-orange-500/10',
    solidBg: 'bg-orange-500',
    softBorder: 'border-orange-100 dark:border-orange-500/20',
    strongBg: 'bg-orange-100 dark:bg-orange-500/20',
    hex: '#F97316',
  },
  slate: {
    iconBg: 'bg-slate-100 dark:bg-slate-700/50',
    iconText: 'text-slate-600 dark:text-slate-300',
    softBg: 'bg-slate-50/70 dark:bg-slate-700/20',
    solidBg: 'bg-slate-500',
    softBorder: 'border-slate-200 dark:border-slate-700/60',
    strongBg: 'bg-slate-200/70 dark:bg-slate-700/60',
    hex: '#64748B',
  },
}
