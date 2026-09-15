import type { LessonListStatus } from '../../types'

interface BadgeConfig {
  label: string
  dot: string
  badge: string
  pulse?: boolean
}

/** Darslar ro'yxati holati: O'tkazildi (yashil) | Faol (ko'k) | Tugallandi (kulrang) */
const config: Record<LessonListStatus, BadgeConfig> = {
  held: {
    label: "O'tkazildi",
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  },
  active: {
    label: 'Faol',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
    pulse: true,
  },
  completed: {
    label: 'Tugallandi',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:ring-slate-600/60',
  },
}

export function LessonBadge({ status }: { status: LessonListStatus }) {
  const c = config[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${c.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  )
}
