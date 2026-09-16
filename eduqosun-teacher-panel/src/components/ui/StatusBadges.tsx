import type { AccentColor, LessonPhase, StudentStatus } from '../../types'
import { studentStatusLabel } from '../../data/catalog'
import { formatShortDuration } from '../../lib/date'
import { scoreTone, type ToneColor } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { formatGrade } from '../../domain/grades'
import { Badge } from './Badge'

const phaseConfig: Record<LessonPhase, { label: string; color: AccentColor; pulse?: boolean }> = {
  held: { label: "O'tkazildi", color: 'green' },
  live: { label: 'Hozir', color: 'blue', pulse: true },
  upcoming: { label: 'Rejalashtirilgan', color: 'slate' },
  planned: { label: 'Rejalashtirilgan', color: 'slate' },
  canceled: { label: 'Bekor qilingan', color: 'rose' },
}

/** Dars holati: O'tkazildi (yashil) · Hozir (ko'k, miltillaydi) · Rejalashtirilgan (kulrang) */
export function LessonPhaseBadge({ phase, size = 'sm' }: { phase: LessonPhase; size?: 'xs' | 'sm' }) {
  const config = phaseConfig[phase]
  return (
    <Badge color={config.color} dot pulse={config.pulse} size={size}>
      {config.label}
    </Badge>
  )
}

/**
 * Darslarim uslubidagi holat: "Dars boshlandi" / "1 soat 12 daqiqa qoldi".
 * `minutesLeft` — bugungi dars boshlanishigacha qolgan vaqt.
 */
export function LessonCountdownBadge({ phase, minutesLeft }: { phase: LessonPhase; minutesLeft: number }) {
  if (phase === 'live') {
    return (
      <Badge color="green" dot pulse>
        Dars boshlandi
      </Badge>
    )
  }
  if (phase === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/15 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/25">
        <span className="h-2 w-2 shrink-0 rounded-full border-2 border-blue-500" aria-hidden="true" />
        {formatShortDuration(minutesLeft)} qoldi
      </span>
    )
  }
  return <LessonPhaseBadge phase={phase} />
}

const studentStatusColor: Record<StudentStatus, AccentColor> = {
  active: 'green',
  left: 'rose',
  transferred: 'violet',
  graduated: 'blue',
}

export function StudentStatusBadge({ status, size = 'sm' }: { status: StudentStatus; size?: 'xs' | 'sm' }) {
  return (
    <Badge color={studentStatusColor[status]} dot size={size}>
      {studentStatusLabel[status]}
    </Badge>
  )
}

const scoreClasses: Record<ToneColor, string> = {
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  slate: 'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400',
}

/** O'rtacha baho belgisi (rangli, 10 ballik) */
export function ScoreBadge({ value, className }: { value: number | null; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 min-w-11 items-center justify-center rounded-lg px-2 text-[13px] font-bold tabular-nums',
        scoreClasses[scoreTone(value)],
        className,
      )}
    >
      {value === null ? '—' : formatGrade(value)}
    </span>
  )
}
