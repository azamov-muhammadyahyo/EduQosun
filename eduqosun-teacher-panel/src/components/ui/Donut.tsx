import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface DonutSegment {
  id: string
  value: number
  /** SVG chiziq rangi sinfi, masalan "stroke-emerald-500" */
  strokeClass: string
}

interface DonutProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  /** Markazdagi matn */
  children?: ReactNode
  className?: string
  label?: string
}

/** Yengil SVG halqa diagramma (recharts'siz — tez va aniq o'lchamda) */
export function Donut({ segments, size = 136, thickness = 16, children, className, label }: DonutProps) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0)
  const visible = segments.filter((s) => s.value > 0)
  const gap = visible.length > 1 ? Math.min(4, circumference * 0.012) : 0

  let offset = 0
  return (
    <div className={cn('relative shrink-0', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-slate-100 dark:stroke-slate-700"
        />
        {total > 0
          ? visible.map((segment) => {
              const length = (segment.value / total) * circumference
              const dash = Math.max(0, length - gap)
              const element = (
                <circle
                  key={segment.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  className={cn(segment.strokeClass, 'transition-all duration-500')}
                />
              )
              offset += length
              return element
            })
          : null}
      </svg>
      {children ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      ) : null}
    </div>
  )
}
