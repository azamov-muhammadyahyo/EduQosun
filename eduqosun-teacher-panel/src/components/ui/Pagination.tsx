import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'

interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
  className?: string
}

/** Sahifa raqamlari: 1 … 4 5 6 … 12 */
function pageList(page: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const pages = new Set([1, count, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push('gap')
    result.push(p)
  })
  return result
}

const navButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'

export function Pagination({ page, pageCount, onChange, className }: PaginationProps) {
  if (pageCount <= 1) return null
  return (
    <nav className={cn('flex items-center gap-1.5', className)} aria-label="Sahifalash">
      <button type="button" className={navButton} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Oldingi sahifa">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      {pageList(page, pageCount).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-xs text-slate-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'h-8 min-w-8 rounded-lg px-2 text-xs font-semibold tabular-nums transition-colors',
              item === page
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className={navButton}
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        aria-label="Keyingi sahifa"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  )
}

/** Ro'yxatni sahifalarga bo'lish */
export function paginate<T>(items: T[], page: number, pageSize: number): { slice: T[]; pageCount: number; page: number } {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)
  return { slice: items.slice((safePage - 1) * pageSize, safePage * pageSize), pageCount, page: safePage }
}
