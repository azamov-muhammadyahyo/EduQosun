import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface TabItem<T extends string> {
  value: T
  label: string
  count?: number
  icon?: LucideIcon
}

interface SegmentedControlProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
  label?: string
  fullWidth?: boolean
}

/** Kulrang "pill" ichidagi tugmalar guruhi: Bugun | Hafta | Oy */
export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  size = 'md',
  className,
  label,
  fullWidth = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/40',
        fullWidth && 'flex w-full',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value
        const Icon = item.icon
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              size === 'sm' ? 'h-7 px-3 text-xs' : 'h-8 px-4 text-sm sm:px-5',
              fullWidth && 'flex-1',
              active
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
            )}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {item.label}
            {item.count !== undefined ? (
              <span className={cn('text-[11px] tabular-nums', active ? 'text-white/80' : 'text-slate-400')}>
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

interface FilterPillsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  label?: string
  size?: 'sm' | 'md'
}

/** Alohida "pill" filtr tugmalari: [Barcha guruhlar (6)] [Faol (5)] [Tugagan (1)] */
export function FilterPills<T extends string>({ items, value, onChange, className, label, size = 'md' }: FilterPillsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('flex flex-wrap items-center gap-2', className)}>
      {items.map((item) => {
        const active = item.value === value
        const Icon = item.icon
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-4 text-[13px]',
              active
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60',
            )}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {item.label}
            {item.count !== undefined ? <span className="tabular-nums">({item.count})</span> : null}
          </button>
        )
      })}
    </div>
  )
}
