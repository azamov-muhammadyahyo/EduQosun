import type { AccentColor } from '../../types'
import { accent } from '../../lib/colors'
import { cn } from '../../lib/cn'
import { clamp } from '../../lib/format'

interface ProgressBarProps {
  /** 0–100 */
  value: number
  color?: AccentColor
  size?: 'xs' | 'sm' | 'md'
  className?: string
  label?: string
}

const heights = { xs: 4, sm: 6, md: 8 } as const

/**
 * Chiziqli progress. SVG atributlari bilan chiziladi — inline style ishlatilmaydi,
 * shunda Tailwind sinflari va qorong'i rejim to'g'ri ishlaydi.
 */
export function ProgressBar({ value, color = 'blue', size = 'sm', className, label }: ProgressBarProps) {
  const height = heights[size]
  const safe = clamp(Number.isFinite(value) ? value : 0, 0, 100)
  return (
    <svg
      className={cn('block w-full overflow-hidden rounded-full', className)}
      height={height}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safe)}
      aria-label={label}
    >
      <rect width="100%" height={height} rx={height / 2} className="fill-slate-100 dark:fill-slate-700" />
      {safe > 0 ? (
        <rect width={`${safe}%`} height={height} rx={height / 2} className={cn(accent[color].fill, 'transition-all')} />
      ) : null}
    </svg>
  )
}
