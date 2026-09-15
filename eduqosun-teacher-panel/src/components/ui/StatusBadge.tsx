import type { LessonStatus } from '../../types'

interface StatusConfig {
  label: string
  dot: string
  badge: string
}

/** Badge ranglari: O'tkazildi = yashil, Hozir = ko'k, Rejalashtirilgan = kulrang (§8) */
const statusConfig: Record<LessonStatus, StatusConfig> = {
  held: {
    label: "O'tkazildi",
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  now: {
    label: 'Hozir',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  },
  planned: {
    label: 'Rejalashtirilgan',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
  },
}

export function StatusBadge({ status }: { status: LessonStatus }) {
  const cfg = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${cfg.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${status === 'now' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  )
}
