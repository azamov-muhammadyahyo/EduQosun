import { cn } from '../../lib/cn'

export interface StackedSegment {
  id: string
  value: number
  /** SVG to'ldirish sinfi: "fill-emerald-500" */
  fillClass: string
  label: string
}

/** Bir nechta ulushdan iborat gorizontal chiziq (davomat tarkibi va h.k.) */
export function StackedBar({ segments, height = 8, className }: { segments: StackedSegment[]; height?: number; className?: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  let offset = 0
  return (
    <svg
      className={cn('block w-full overflow-hidden rounded-full', className)}
      height={height}
      role="img"
      aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}
    >
      <rect width="100%" height={height} className="fill-slate-100 dark:fill-slate-700" />
      {total > 0
        ? segments.map((segment) => {
            const width = (segment.value / total) * 100
            const rect = (
              <rect key={segment.id} x={`${offset}%`} width={`${width}%`} height={height} className={segment.fillClass}>
                <title>{`${segment.label}: ${segment.value}`}</title>
              </rect>
            )
            offset += width
            return rect
          })
        : null}
    </svg>
  )
}
